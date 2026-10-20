/* 十五二十 — 划拳（两手拳/掌，猜总数） */
const D = BX.draw, C = BX.C;
const CALLS = [0, 5, 10, 15, 20];
const CALLW = {0: '零！', 5: '五！', 10: '十！', 15: '十五！', 20: '二十！'};
const CALLN = {0: '零', 5: '五', 10: '十', 15: '十五', 20: '二十'};
const WIN = 5;
const okCall = (h, c) => c >= h * 5 && c <= h * 5 + 10;

/* AI: choose hands (0..2 open) + call. history entries {h:[h0,h1], c:[c0,c1]} */
function aiChoose(st, seat, level, rnd) {
  const op = 1 - seat, hist = st.hist;
  const pickW = w => { let s = 0; for (const x of w) s += x; let r = rnd() * s; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return w.length - 1; };
  if (level === 1) {
    const h = Math.floor(rnd() * 3);
    const c = h * 5 + 5 * Math.floor(rnd() * 3);
    return {h, c};
  }
  // opponent hand distribution estimate
  let pd = [1, 2, 1];
  if (level === 3 && hist.length) {
    pd = [1, 1, 1];
    hist.forEach((r, i) => { const w = 1 + i / hist.length * 2; pd[r.h[op]] += w; });
    // conditional on opponent's previous hand (simple Markov)
    const lastH = hist[hist.length - 1].h[op];
    const tr = [0, 0, 0]; let tn = 0;
    for (let i = 1; i < hist.length; i++) if (hist[i - 1].h[op] === lastH) { tr[hist[i].h[op]]++; tn++; }
    if (tn >= 2) for (let k = 0; k < 3; k++) pd[k] = pd[k] * .5 + (tr[k] + .3) / (tn + 1) * hist.length * .5;
  }
  const tot = pd[0] + pd[1] + pd[2]; pd = pd.map(x => x / tot);
  // opponent's tendency to call each offset (their call minus their own hands)
  let my = [1, 1, 1];
  if (level === 3 && hist.length >= 2) {
    // what total will the opponent guess? predict their offset (call - own*5)/5 ∈ {0,1,2} → they guess my hands = offset
    const off = [1, 1, 1]; hist.forEach(r => off[(r.c[op] - r.h[op] * 5) / 5] += 1);
    // pick my hands to avoid the value they expect (they win if their offset == my hands)
    const s = off[0] + off[1] + off[2];
    my = off.map(x => 1.25 - x / s);
  }
  const h = level === 3 ? pickW(my.map((x, i) => x * [1, 1.2, 1][i])) : pickW([1, 2, 1]);
  // call: own h + expected opponent hands
  const cand = [0, 1, 2].map(k => [k, pd[k]]);
  let k;
  if (level === 2) k = rnd() < .6 ? 1 : pickW([1, 0, 1]);
  else { cand.sort((a, b) => b[1] - a[1]); k = rnd() < .8 ? cand[0][0] : cand[1][0]; }
  return {h, c: h * 5 + k * 5};
}

BX.register({
  id: 'huaquan', title: '十五二十', cat: 'folk', order: 3, sub: '出拳喊数，猜中得分',
  desc: '酒桌上最常见的划拳：两人同时伸出双手，每只手是拳（0）或掌（5），同时喊出一个总数——十五！二十！喊中者得一分，先得 5 分获胜。',
  kind: 'turn', seats: 2, hidden: true, noFirst: true, undo: false, aiDelay: 500, seatNames: ['甲', '乙'], seatColors: ['#b23a2b', '#2f5d8a'],
  rules: `<p>两人对局。每一回合双方<b>同时</b>出手：两只手各自出<b>拳</b>（算 0）或<b>掌</b>（算 5），所以自己的两只手合计是 0、5 或 10；同时喊出一个总数：<b>零、五、十、十五、二十</b>之一。</p>
<p>喊的数必须合理：至少等于自己手上的数，至多再加 10（对方最多也只有 10）。例如自己出了两只掌（10），只能喊十、十五或二十。</p>
<p>亮手后计算四只手的总和：<b>只有一人喊中</b>则此人得 1 分；两人都喊中或都没喊中，本回合不计分。<b>先得 5 分</b>者获胜。</p>
<p>操作：点左右两只手切换拳/掌，再点一个数字喊出（喊数即确认出手）。键盘：A / D 切换左右手，数字键 1–5 喊零到二十。同屏对战时轮流秘密出手，别偷看哦。</p>
<p>电脑：初级随手乱喊；中级按概率出手、常喊“中间数”；高级会记住你的出手习惯与喊数规律，针对性地出拳和喊数。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#8a2a20', '#4a1410');
    g.fillStyle = 'rgba(230,197,125,.15)'; D.circle(g, w / 2, h / 2, h * .45); g.fill();
    drawHand(g, w * .26, h * .62, h * .28, true, .35, '#f0c9a0');
    drawHand(g, w * .74, h * .62, h * .28, false, -.35, '#e8b88a', true);
    bubble(g, w * .5, h * .2, '十五！', h * .16);
  },
  create(ctx) {
    const st = {sc: [0, 0], pick: [null, null], hist: [], round: 1, ph: 'pick', last: null, over: false};
    const cv = ctx.canvas();
    const draft = [[0, 0], [0, 0]];   // hands (0=拳 1=掌) per local seat
    const vis = {t0: 0, rev: 1, bubbles: 1, pt: 0};
    const now = () => performance.now();
    const me = () => ctx.view;
    const canPick = () => st.ph === 'pick' && ctx.canAct(me());
    const flip = () => me() === 1 && (ctx.mySeats.length === 1 || ctx.hotseat);

    function layout() {
      const W = cv.w, H = cv.h, land = W > H * 1.15;
      const L = {W, H, land};
      if (land) {
        const pw = Math.min(W * .4, 380);
        L.arena = {x: 0, y: 0, w: W - pw, h: H};
        L.ctrl = {x: W - pw, y: 0, w: pw, h: H};
      } else {
        const ch = BX.clamp(H * .36, 200, 300);
        L.arena = {x: 0, y: 0, w: W, h: H - ch};
        L.ctrl = {x: 0, y: H - ch, w: W, h: ch};
      }
      const A = L.arena;
      L.hs = Math.min(A.w * (land ? .16 : .2), A.h * .2);
      const K = L.ctrl, pad = 10;
      // hand toggles
      const tb = Math.min((K.w - pad * 3) / 2, K.h * .4, 150);
      const bw = Math.min((K.w - pad * 6) / 5, 76), bh = BX.clamp(K.h * .2, 44, 58);
      const total = 22 + tb + 12 + bh + 22, top = K.y + Math.max(pad, (K.h - total) / 2);
      L.tog = [0, 1].map(i => ({x: K.x + K.w / 2 + (i ? pad / 2 : -pad / 2 - tb), y: top + 22, w: tb, h: tb}));
      const cy = top + 22 + tb + 12;
      L.hint = top + 10; L.hint2 = cy + bh + 12;
      L.calls = CALLS.map((c, i) => ({c, x: K.x + K.w / 2 - (bw * 5 + pad * 4) / 2 + i * (bw + pad), y: cy, w: bw, h: bh}));
      return L;
    }
    const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!canPick()) return;
      const L = layout(), p = cv.pos(e), s = me();
      for (let i = 0; i < 2; i++) if (inR(p, L.tog[i])) { draft[s][i] ^= 1; ctx.sfx('flip'); return; }
      for (const b of L.calls) if (inR(p, b)) { shout(b.c); return; }
    });
    ctx.on(window, 'keydown', e => {
      if (!canPick()) return; const s = me();
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { draft[s][0] ^= 1; ctx.sfx('flip'); }
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') { draft[s][1] ^= 1; ctx.sfx('flip'); }
      else { const m = /^(?:Digit|Numpad)([1-5])$/.exec(e.code); if (m) shout(CALLS[+m[1] - 1]); }
    });
    function shout(c) {
      const s = me(), h = draft[s][0] + draft[s][1];
      if (!okCall(h, c)) { ctx.sfx('error'); ctx.toast(`手上已是 ${h * 5}，只能喊 ${CALLN[h * 5]}～${CALLN[h * 5 + 10]}`); return; }
      ctx.sfx('pop'); ctx.act({h: draft[s].slice(), c}, s);
    }
    function status() {
      ctx.info(0, st.sc[0]); ctx.info(1, st.sc[1]);
      if (st.over) { ctx.status(ctx.name(st.sc[0] > st.sc[1] ? 0 : 1) + ` 胜 ${st.sc[0]} : ${st.sc[1]}`); return; }
      const rd = `第 ${st.round} 回合 · 先得 ${WIN} 分胜 · `;
      if (st.ph === 'show') { const l = st.last; ctx.status(rd + `总数 <b>${l.total}</b>` + (l.w >= 0 ? ` · ${ctx.name(l.w)} 喊中！` : l.both ? ' · 都喊中，不计分' : ' · 都没喊中')); return; }
      if (canPick()) ctx.status(rd + (ctx.hotseat ? ctx.name(me()) + '：' : '') + '点手切换拳/掌，再点数字喊出');
      else ctx.status(rd + '等待 ' + ctx.turn.map(s => ctx.name(s)).join('、') + ' 出手…');
    }
    const inst = {
      st,
      toMove() { if (st.over || st.ph !== 'pick') return null; const t = [0, 1].filter(s => !st.pick[s]); return t.length ? t : null; },
      valid(a, by) { return a && Array.isArray(a.h) && a.h.length === 2 && a.h.every(x => x === 0 || x === 1) && CALLS.includes(a.c) && okCall(a.h[0] + a.h[1], a.c) && !st.pick[by] && st.ph === 'pick'; },
      sysMove() {
        if (st.over) return null;
        if (st.ph === 'pick' && st.pick[0] && st.pick[1]) return {a: {t: 'reveal'}, delay: 250};
        if (st.ph === 'show') return {a: {t: 'next'}, delay: 2600};
        return null;
      },
      apply(a, by) {
        if (a.t === 'reveal') {
          if (st.ph !== 'pick' || !st.pick[0] || !st.pick[1]) return;
          const p = st.pick, hs = [p[0].h[0] + p[0].h[1], p[1].h[0] + p[1].h[1]], total = (hs[0] + hs[1]) * 5;
          const ok = [p[0].c === total, p[1].c === total];
          const w = ok[0] && !ok[1] ? 0 : ok[1] && !ok[0] ? 1 : -1;
          if (w >= 0) st.sc[w]++;
          st.last = {p: [p[0], p[1]], total, w, both: ok[0] && ok[1]};
          st.hist.push({h: hs, c: [p[0].c, p[1].c]});
          st.ph = 'show';
          if (!ctx.fast) {
            vis.t0 = now(); vis.rev = 0; vis.bubbles = 0;
            ctx.sfx('whoosh');
            ctx.anim(380, k => vis.bubbles = k, null, BX.ease.back);
            ctx.after(150, () => ctx.sfx('pop'));
            ctx.after(420, () => { ctx.sfx('hit'); ctx.anim(320, k => vis.rev = k, () => { ctx.sfx(w >= 0 ? 'score' : 'tick'); if (w >= 0) vis.pt = now(); }); });
          } else { vis.rev = 1; vis.bubbles = 1; }
          if (st.sc[0] >= WIN || st.sc[1] >= WIN) {
            st.over = true; const wn = st.sc[0] >= WIN ? 0 : 1;
            status(); ctx.end({winner: wn, text: `${st.sc[0]} : ${st.sc[1]}`, delay: 1900});
          }
        } else if (a.t === 'next') {
          if (st.ph !== 'show') return;
          st.ph = 'pick'; st.pick = [null, null]; st.round++;
          if (st.round > 300) { st.over = true; ctx.end({winner: st.sc[0] === st.sc[1] ? -1 : st.sc[0] > st.sc[1] ? 0 : 1}); }
          if (!ctx.fast) ctx.sfx('swish');
        } else {
          if (st.ph !== 'pick' || st.pick[by] || by < 0) return;
          const h = Array.isArray(a.h) ? a.h.map(x => x ? 1 : 0).slice(0, 2) : [0, 0];
          const c = okCall(h[0] + h[1], a.c) ? a.c : (h[0] + h[1]) * 5 + 5;
          st.pick[by] = {h, c};
          if (!ctx.fast) ctx.sfx('tick');
        }
        status();
      },
      aiMove(seat, level) {
        const r = aiChoose(st, seat, level, Math.random);
        const h = r.h === 0 ? [0, 0] : r.h === 2 ? [1, 1] : (Math.random() < .5 ? [1, 0] : [0, 1]);
        return {h, c: r.c};
      },
      onTurn: status, onView: status,
      ready() { status(); },
      frame() {
        const g = cv.g; cv.clear(); const L = layout(), t = now();
        // background: tavern table
        D.wood(g, 0, 0, L.W, L.H, {base: '#6b3a1f', dark: '#2e160a', seed: 31, grain: .22});
        const A = L.arena;
        // lantern glow
        const rg = g.createRadialGradient(A.x + A.w / 2, A.y + A.h * .5, 10, A.x + A.w / 2, A.y + A.h * .5, Math.max(A.w, A.h) * .7);
        rg.addColorStop(0, 'rgba(255,200,120,.22)'); rg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = rg; g.fillRect(A.x, A.y, A.w, A.h);
        // wine cups + jug decor
        cup(g, A.x + A.w * .5 - L.hs * .9, A.y + A.h * .5, L.hs * .28); cup(g, A.x + A.w * .5 + L.hs * .9, A.y + A.h * .5, L.hs * .28);
        jug(g, A.x + A.w * .5, A.y + A.h * .5, L.hs * .45);
        // scoreboard
        const sy = A.y + A.h * .5;
        const bot = flip() ? 1 : 0, top = 1 - bot;
        drawScore(g, A.x + 14, sy, top, bot, L);
        // hands
        const show = st.ph === 'show' && st.last, spread = Math.min(A.w * .2, L.hs * 1.4);
        for (const [s, yy, up] of [[top, A.y + A.h * .2, false], [bot, A.y + A.h * .8, true]]) {
          let hands = null, call = null;
          if (show) { hands = st.last.p[s].h; call = st.last.p[s].c; }
          else if (ctx.isLocal(s) && s === me() && st.ph === 'pick' && !st.pick[s]) hands = draft[s];
          const decided = !!st.pick[s] && !show;
          const pump = show ? 0 : Math.abs(Math.sin(t / 260 + s)) * L.hs * .12;
          for (let i = 0; i < 2; i++) {
            const x = A.x + A.w / 2 + (i ? spread : -spread) * .5 * (up ? 1 : -1) * (i ? 1 : 1);
            const hx = A.x + A.w / 2 + (i === 0 ? -1 : 1) * spread * .55;
            void x;
            let open = hands ? !!hands[i] : false, sc = 1;
            if (show && vis.rev < 1) { open = vis.rev > .5 ? !!hands[i] : false; sc = 1 + Math.sin(vis.rev * Math.PI) * .15; }
            const hy = yy + (up ? pump : -pump);
            const skin = s === 0 ? '#f0c9a0' : '#e3b386';
            g.save(); g.translate(hx, hy); g.scale(sc * (i === 0 ? 1 : -1), sc * (up ? 1 : -1));
            drawHand(g, 0, 0, L.hs, open, -.12, skin, false, ctx.color(s));
            g.restore();
            if (decided && !(ctx.isLocal(s) && s === me())) { /* hidden: fists shown */ }
          }
          // name tag
          D.text(g, ctx.name(s) + (st.pick[s] && !show ? ' ✓' : ''), A.x + A.w / 2, up ? A.y + A.h - 12 : A.y + 14, {size: 13, color: '#f6e7c8', weight: 700, shadow: true});
          if (show && call != null) {
            const by = up ? yy - L.hs * 1.0 : yy + L.hs * 1.0, k = vis.bubbles;
            const right = call === st.last.total;
            g.save(); g.translate(A.x + A.w / 2 + (up ? 1 : -1) * spread * 1.15, by); g.scale(k, k);
            bubble(g, 0, 0, CALLW[call], L.hs * .32, vis.rev >= 1 ? (right ? '#fff3c4' : '#e9e1d4') : '#fffaf0', vis.rev >= 1 && right ? '#c8a052' : null);
            g.restore();
          } else if (ctx.isLocal(s) && s === me() && canPick()) {
            const h = draft[s][0] + draft[s][1];
            D.text(g, `手上：${CALLN[h * 5]}`, A.x + A.w / 2, yy - L.hs * 1.0, {size: 14, color: '#ffe08a', weight: 700, shadow: true});
          } else if (decided) {
            D.text(g, '已出手 ✓', A.x + A.w / 2 + spread * 1.2, yy, {size: 14, color: 'rgba(246,231,200,.8)', weight: 700, shadow: true});
          }
        }
        // total
        if (show && vis.rev >= 1) {
          const l = st.last;
          const k = BX.clamp((t - vis.t0 - 750) / 300, 0, 1);
          g.save(); g.translate(A.x + A.w * .82, A.y + A.h * .5); g.scale(BX.ease.back(k), BX.ease.back(k));
          g.fillStyle = 'rgba(122,28,18,.92)'; D.circle(g, 0, 0, L.hs * .5); g.fill(); g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.stroke();
          D.text(g, String(l.total), 0, -L.hs * .06, {size: L.hs * .38, color: '#fff3e3', font: 'serif', weight: 900});
          D.text(g, '总数', 0, L.hs * .28, {size: L.hs * .14, color: '#e6c57d'});
          g.restore();
          if (l.w >= 0 && vis.pt) {
            const pk = (t - vis.pt) / 1200;
            if (pk < 1) { const bt = l.w === bot; g.globalAlpha = 1 - pk; D.text(g, '+1', A.x + 50, (bt ? A.y + A.h * .62 : A.y + A.h * .38) - pk * 20, {size: 26, color: '#ffe08a', weight: 900, stroke: '#3a1206', strokeW: 4}); g.globalAlpha = 1; }
          }
        }
        drawCtrl(g, L, t);
      },
    };
    function drawScore(g, x, y, top, bot, L) {
      const w = 34, h = Math.min(L.arena.h * .5, 210);
      g.fillStyle = 'rgba(20,10,5,.5)'; D.rr(g, x, y - h / 2, w, h, 10); g.fill();
      for (const [s, dir] of [[top, -1], [bot, 1]]) {
        for (let j = 0; j < WIN; j++) {
          const cy = y + dir * (12 + j * (h / 2 - 18) / WIN);
          g.fillStyle = j < st.sc[s] ? ctx.color(s) : 'rgba(246,231,200,.15)'; D.circle(g, x + w / 2, cy, 6); g.fill();
          if (j < st.sc[s]) { g.strokeStyle = '#e6c57d'; g.lineWidth = 1; g.stroke(); }
        }
      }
      g.strokeStyle = 'rgba(230,197,125,.5)'; g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + w - 6, y); g.stroke();
    }
    function drawCtrl(g, L, t) {
      const K = L.ctrl, s = me(), can = canPick();
      D.paper(g, K.x + 6, K.y + 6, K.w - 12, K.h - 12, {r: 14, color: '#efe0bd'});
      g.strokeStyle = 'rgba(122,28,18,.45)'; g.lineWidth = 1.5; D.rr(g, K.x + 10, K.y + 10, K.w - 20, K.h - 20, 10); g.stroke();
      const hint = can ? '① 点手切换 拳 / 掌' : st.ph === 'show' ? '亮手！' : st.pick[s] ? '已出手，等待对方…' : '等待…';
      D.text(g, hint, K.x + K.w / 2, L.hint, {size: 14, color: C.ink2, weight: 700});
      const hands = ctx.isLocal(s) ? draft[s] : [0, 0];
      for (let i = 0; i < 2; i++) {
        const b = L.tog[i], open = !!hands[i];
        g.globalAlpha = can ? 1 : .5;
        g.fillStyle = open ? 'rgba(63,127,107,.18)' : 'rgba(178,58,43,.12)'; D.rr(g, b.x, b.y, b.w, b.h, 14); g.fill();
        g.strokeStyle = open ? C.jade : C.red; g.lineWidth = 2; g.stroke();
        g.save(); g.translate(b.x + b.w / 2, b.y + b.h * .48); g.scale(i === 0 ? 1 : -1, 1);
        drawHand(g, 0, 0, b.h * .36, open, 0, s === 0 ? '#f0c9a0' : '#e3b386', false, ctx.color(s));
        g.restore();
        D.text(g, (i ? '右手 · ' : '左手 · ') + (open ? '掌 5' : '拳 0'), b.x + b.w / 2, b.y + b.h - 11, {size: Math.min(13, b.w * .1), color: open ? C.jade : C.red, weight: 800});
        g.globalAlpha = 1;
      }
      const hv = (hands[0] + hands[1]);
      for (const b of L.calls) {
        const ok = can && okCall(hv, b.c);
        g.globalAlpha = ok ? 1 : .35;
        g.fillStyle = '#6e1d14'; D.rr(g, b.x, b.y + 3, b.w, b.h - 3, 10); g.fill();
        const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, '#d0533f'); gr.addColorStop(1, '#a33022');
        g.fillStyle = gr; D.rr(g, b.x, b.y, b.w, b.h - 4, 10); g.fill();
        D.text(g, CALLN[b.c], b.x + b.w / 2, b.y + (b.h - 4) / 2, {size: Math.min(20, b.w * .32), color: '#fff3e3', font: 'serif', weight: 900});
        g.globalAlpha = 1;
      }
      if (can && L.hint2 < K.y + K.h - 10) D.text(g, '② 点数字喊出（即出手）', K.x + K.w / 2, L.hint2, {size: 12, color: C.ink2});
    }
    status();
    return inst;
  },
});

/* hand drawing: fist (open=false) or palm (open=true), centered at (x,y), size s, fingers pointing up.
   Shapes are stroked first (thick) then filled, giving one clean ink outline around the silhouette. */
function drawHand(g, x, y, s, open, rot, skin, mirror, cuff) {
  g.save(); g.translate(x, y); g.rotate(rot || 0); if (mirror) g.scale(-1, 1);
  const line = D.shade(skin, -45), shapes = [];
  const rr = (cx, cy, w, h, r, a) => shapes.push(() => { g.save(); g.translate(cx, cy); g.rotate(a || 0); D.rr(g, -w / 2, -h / 2, w, h, r); g.restore(); });
  const ci = (cx, cy, r) => shapes.push(() => D.circle(g, cx, cy, r));
  rr(0, s * .5, s * .5, s * .36, s * .1);                               // wrist
  if (open) {
    rr(0, s * .08, s * .66, s * .66, s * .24);                          // palm
    const F = [[-.25, -.42, .14, .6, -.2], [-.085, -.51, .15, .7, -.07], [.08, -.5, .15, .68, .06], [.235, -.39, .13, .56, .2]];
    for (const [fx, fy, fw, fh, an] of F) rr(s * fx, s * fy, s * fw, s * fh, s * fw / 2, an);
    rr(s * .38, s * .14, s * .15, s * .42, s * .075, -.75);             // thumb
  } else {
    rr(0, s * .02, s * .72, s * .7, s * .22);                           // fist body
    for (let i = 0; i < 4; i++) ci(-s * .255 + i * s * .17, -s * .3, s * .1);   // knuckles
    rr(s * .06, s * .1, s * .5, s * .17, s * .085, -.05);               // thumb across
  }
  g.lineJoin = 'round';
  g.strokeStyle = line; g.lineWidth = Math.max(2, s * .06);
  for (const f of shapes) { f(); g.stroke(); }
  const gr = g.createLinearGradient(-s * .4, -s * .6, s * .4, s * .6); gr.addColorStop(0, D.shade(skin, 10)); gr.addColorStop(1, D.shade(skin, -8));
  g.fillStyle = gr;
  for (const f of shapes) { f(); g.fill(); }
  // details
  g.strokeStyle = D.alpha(line, .55); g.lineWidth = Math.max(1, s * .025); g.lineCap = 'round';
  if (open) {
    g.beginPath(); g.moveTo(-s * .22, s * .02); g.quadraticCurveTo(0, s * .12, s * .2, -s * .04); g.stroke();
    g.beginPath(); g.moveTo(-s * .2, s * .2); g.quadraticCurveTo(-s * .02, s * .26, s * .14, s * .32); g.stroke();
  } else {
    for (let i = 0; i < 3; i++) { const fx = -s * .17 + i * s * .17; g.beginPath(); g.moveTo(fx, -s * .3); g.lineTo(fx, -s * .06); g.stroke(); }
    g.strokeStyle = line; g.lineWidth = Math.max(1.5, s * .035); rr(s * .06, s * .1, s * .5, s * .17, s * .085, -.05); shapes[shapes.length - 1](); g.stroke();
    g.fillStyle = D.alpha('#ffffff', .25); g.beginPath(); g.ellipse(s * .26, s * .08, s * .06, s * .035, 0, 0, Math.PI * 2); g.fill();   // nail
  }
  // sleeve
  g.fillStyle = cuff || '#7a1c12'; D.rr(g, -s * .4, s * .62, s * .8, s * .5, s * .1); g.fill();
  g.fillStyle = 'rgba(230,197,125,.9)'; g.fillRect(-s * .4, s * .62, s * .8, s * .07);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-s * .4, s * .69, s * .8, s * .04);
  g.restore();
}
function bubble(g, x, y, text, size, fill, ring) {
  g.save();
  g.font = `900 ${size}px ${BX.F.serif}`; const tw = g.measureText(text).width, w = tw + size * 1.2, h = size * 1.7;
  g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, x - w / 2 + 2, y - h / 2 + 3, w, h, h / 2); g.fill();
  g.fillStyle = fill || '#fffaf0'; D.rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill();
  g.beginPath(); g.moveTo(x - size * .3, y + h / 2 - 1); g.lineTo(x - size * .1, y + h / 2 + size * .5); g.lineTo(x + size * .2, y + h / 2 - 1); g.fill();
  g.strokeStyle = ring || '#7a1c12'; g.lineWidth = ring ? 3 : 1.5; D.rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.stroke();
  D.text(g, text, x, y + 1, {size, color: '#7a1c12', font: 'serif', weight: 900});
  g.restore();
}
function cup(g, x, y, r) {
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + 2, y + r * .9, r * 1.1, r * .35, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e9e1cf'; g.beginPath(); g.moveTo(x - r, y - r * .2); g.lineTo(x + r, y - r * .2); g.lineTo(x + r * .55, y + r * .8); g.lineTo(x - r * .55, y + r * .8); g.closePath(); g.fill();
  g.fillStyle = '#2f5d8a'; g.fillRect(x - r * .8, y + r * .15, r * 1.6, r * .12);
  g.fillStyle = '#b8862e'; g.beginPath(); g.ellipse(x, y - r * .2, r, r * .3, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d9a650'; g.beginPath(); g.ellipse(x, y - r * .18, r * .82, r * .22, 0, 0, Math.PI * 2); g.fill();
}
function jug(g, x, y, r) {
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + 3, y + r * 1.05, r * .9, r * .25, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, '#3a1a0e'); gr.addColorStop(.4, '#8a4a28'); gr.addColorStop(1, '#2a1208');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - r * .25, y - r * .9); g.quadraticCurveTo(x - r * .3, y - r * .5, x - r * .9, y + r * .1); g.quadraticCurveTo(x - r, y + r, x, y + r); g.quadraticCurveTo(x + r, y + r, x + r * .9, y + r * .1); g.quadraticCurveTo(x + r * .3, y - r * .5, x + r * .25, y - r * .9); g.closePath(); g.fill();
  g.fillStyle = '#c23a2b'; g.fillRect(x - r * .32, y - r * 1.05, r * .64, r * .2);
  g.fillStyle = '#f3e2c0'; g.save(); g.translate(x, y + r * .3); g.rotate(Math.PI / 4); g.fillRect(-r * .28, -r * .28, r * .56, r * .56); g.restore();
  D.text(g, '酒', x, y + r * .32, {size: r * .42, color: '#2b2118', font: 'serif', weight: 900});
}
