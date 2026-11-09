/* 十五二十 — 划拳（两手拳/掌，猜总数） */
const D = BX.draw, C = BX.C;
const CALLS = [0, 5, 10, 15, 20];
const CALLW = {0: '零！', 5: '五！', 10: '十！', 15: '十五！', 20: '二十！'};
const CALLN = {0: '零', 5: '五', 10: '十', 15: '十五', 20: '二十'};
const WIN = 5;
const okCall = (h, c) => c >= h * 5 && c <= h * 5 + 10;
const HANDS = [[0, 0], [0, 1], [1, 1]];
const HANDN = ['双拳', '一拳一掌', '双掌'];
const ODD = [.25, .5, .25];   // chance the opponent shows 0 / 1 / 2 palms if they play at random
const BEAT = 3600;

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
<p>操作：先选出手（双拳 / 一拳一掌 / 双掌），再点一个数字喊出（喊数即确认出手）；出手会沿用上一回合，熟练后一回合只需点一下。键盘：Q / W / E 选出手（或 A / D 切换左右手），数字键 1–5 喊零到二十。同屏对战时轮流秘密出手，别偷看哦。</p>
<p>可选<b>胜分</b>（3 / 5 / 7 分）与<b>快拳</b>节奏：快拳模式每回合限时约 3 秒，跟着节拍出手，超时按当前出手自动喊中间数。</p>
<p>电脑：初级随手乱喊；中级按概率出手、常喊“中间数”；高级会记住你的出手习惯与喊数规律，针对性地出拳和喊数。</p>`,
  options: [{key: 'goal', label: '胜分', choices: [[3, '先得 3 分'], [5, '先得 5 分'], [7, '先得 7 分']], def: 5},
    {key: 'pace', label: '节奏', choices: [[0, '从容'], [1, '快拳（限时）']], def: 0}],
  howto: ['先点下方「双拳 / 一拳一掌 / 双掌」选出手，再点一个数字喊出（喊数即出手）；出手会保留到下一回合，熟练后一回合点一下即可。', '喊的数 = 自己手上 + 你猜对方手上（0/5/10）；不合理的数会变灰。数字下方的百分比是对方随手出时的命中机会。', '双方亮手，只有一人喊中得 1 分；连中会有提示，输一分罚酒一杯。', '快拳模式：跟着节拍约 3 秒内出手，超时自动按当前出手喊中间数。', '键盘：Q/W/E 选出手，1–5 喊 零～二十。💡 提示会给出推荐的出手和喊数。'],
  icon(g, w, h) {
    D.iconBase(g, w, h, '#8a2a20', '#4a1410');
    g.fillStyle = 'rgba(230,197,125,.15)'; D.circle(g, w / 2, h / 2, h * .45); g.fill();
    drawHand(g, w * .26, h * .62, h * .28, true, .35, '#f0c9a0');
    drawHand(g, w * .74, h * .62, h * .28, false, -.35, '#e8b88a', true);
    bubble(g, w * .5, h * .2, '十五！', h * .16);
  },
  create(ctx) {
    const goal = ctx.opts.goal || WIN, beat = !!ctx.opts.pace;
    const st = {sc: [0, 0], pick: [null, null], hist: [], round: 1, ph: 'pick', last: null, over: false, streak: [0, 0], best: [0, 0]};
    const cv = ctx.canvas();
    const draft = [[0, 0], [0, 0]];   // hands (0=拳 1=掌) per local seat
    const vis = {t0: 0, rev: 1, bubbles: 1, pt: 0};
    let hintA = null, hintT = 0, pickT0 = 0, beatN = -1;
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
      L.hs = Math.min(A.w * (land ? .15 : .2), A.h * .19);
      const K = L.ctrl, pad = 8, iw = Math.min(K.w - 32, 420), x0 = K.x + (K.w - iw) / 2;
      const hb = BX.clamp(K.h * .26, 58, land ? 92 : 84), bh = BX.clamp(K.h * .17, 46, 58);
      const blockH = 24 + hb + 10 + bh + 34;
      const top = land ? K.y + Math.max(16, Math.min(K.h * .12, K.h - blockH - 12)) : K.y + Math.max(12, (K.h - blockH) / 2);
      L.hint = top + 10;
      const hw = (iw - pad * 2) / 3;
      L.hands = [0, 1, 2].map(i => ({i, x: x0 + i * (hw + pad), y: top + 24, w: hw, h: hb}));
      const cy = top + 24 + hb + 10, cw = (iw - pad * 4) / 5;
      L.calls = CALLS.map((c, i) => ({c, x: x0 + i * (cw + pad), y: cy, w: cw, h: bh}));
      L.hint2 = cy + bh + 22;
      L.hist = land ? {x: x0, y: L.hint2 + 18, w: iw, h: K.y + K.h - 20 - (L.hint2 + 18)} : null;
      return L;
    }
    const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!canPick()) return;
      const L = layout(), p = cv.pos(e), s = me();
      for (const b of L.hands) if (inR(p, b)) { setHands(s, b.i); return; }
      for (const b of L.calls) if (inR(p, b)) { shout(b.c); return; }
    });
    ctx.on(window, 'keydown', e => {
      if (!canPick()) return; const s = me();
      const q = {KeyQ: 0, KeyW: 1, KeyE: 2}[e.code];
      if (q != null) { setHands(s, q); return; }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { draft[s][0] ^= 1; ctx.sfx('flip'); }
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') { draft[s][1] ^= 1; ctx.sfx('flip'); }
      else { const m = /^(?:Digit|Numpad)([1-5])$/.exec(e.code); if (m) shout(CALLS[+m[1] - 1]); }
    });
    function setHands(s, i) { if (draft[s][0] + draft[s][1] === i) { ctx.sfx('tick'); return; } draft[s] = HANDS[i].slice(); ctx.sfx('flip'); }
    function shout(c) {
      const s = me(), h = draft[s][0] + draft[s][1];
      if (!okCall(h, c)) { ctx.sfx('error'); ctx.toast(`手上已是 ${h * 5}，只能喊 ${CALLN[h * 5]}～${CALLN[h * 5 + 10]}`); return; }
      ctx.sfx('pop'); hintA = null; pickT0 = 0; ctx.act({h: draft[s].slice(), c}, s);
    }
    function status() {
      ctx.info(0, st.sc[0]); ctx.info(1, st.sc[1]);
      if (st.over) { ctx.status(ctx.name(st.sc[0] > st.sc[1] ? 0 : 1) + ` 胜 ${st.sc[0]} : ${st.sc[1]}`); return; }
      const rd = `第 ${st.round} 回合 · 先得 ${goal} 分胜 · `;
      if (st.ph === 'show') { const l = st.last; ctx.status(rd + `总数 <b>${l.total}</b>` + (l.w >= 0 ? ` · ${ctx.name(l.w)} 喊中！` : l.both ? ' · 都喊中，不计分' : ' · 都没喊中')); return; }
      if (canPick()) ctx.status(rd + (ctx.hotseat ? ctx.name(me()) + '：' : '') + '选出手，再点数字喊出');
      else ctx.status(rd + '等待 ' + ctx.turn.map(s => ctx.name(s)).join('、') + ' 出手…');
    }
    const inst = {
      st,
      toMove() { if (st.over || st.ph !== 'pick') return null; const t = [0, 1].filter(s => !st.pick[s]); return t.length ? t : null; },
      valid(a, by) { return a && Array.isArray(a.h) && a.h.length === 2 && a.h.every(x => x === 0 || x === 1) && CALLS.includes(a.c) && okCall(a.h[0] + a.h[1], a.c) && !st.pick[by] && st.ph === 'pick'; },
      sysMove() {
        if (st.over) return null;
        if (st.ph === 'pick' && st.pick[0] && st.pick[1]) return {a: {t: 'reveal'}, delay: 250};
        if (st.ph === 'show') return {a: {t: 'next'}, delay: beat ? 1900 : 2600};
        return null;
      },
      apply(a, by) {
        if (a.t === 'reveal') {
          if (st.ph !== 'pick' || !st.pick[0] || !st.pick[1]) return;
          const p = st.pick, hs = [p[0].h[0] + p[0].h[1], p[1].h[0] + p[1].h[1]], total = (hs[0] + hs[1]) * 5;
          const ok = [p[0].c === total, p[1].c === total];
          const w = ok[0] && !ok[1] ? 0 : ok[1] && !ok[0] ? 1 : -1;
          if (w >= 0) { st.sc[w]++; st.streak[w]++; st.streak[1 - w] = 0; if (st.streak[w] > st.best[w]) st.best[w] = st.streak[w]; }
          st.last = {p: [p[0], p[1]], total, w, both: ok[0] && ok[1]};
          st.hist.push({h: hs, c: [p[0].c, p[1].c]});
          st.ph = 'show';
          if (!ctx.fast) {
            vis.t0 = now(); vis.rev = 0; vis.bubbles = 0;
            ctx.sfx('whoosh');
            ctx.anim(380, k => vis.bubbles = k, null, BX.ease.back);
            ctx.after(150, () => ctx.sfx('pop'));
            ctx.after(420, () => { ctx.sfx('hit'); ctx.anim(320, k => vis.rev = k, () => {
              ctx.sfx(w >= 0 ? 'score' : 'tick'); if (w >= 0) vis.pt = now();
              if (w >= 0 && ctx.isLocal(w) && !ctx.isLocal(1 - w)) ctx.buzz(20);
              if (w >= 0 && st.streak[w] >= 3) ctx.toast(`${ctx.name(w)} 连中 ${st.streak[w]} 拳！`);
            }); });
          } else { vis.rev = 1; vis.bubbles = 1; }
          hintA = null;
          if (st.sc[0] >= goal || st.sc[1] >= goal) {
            st.over = true; const wn = st.sc[0] >= goal ? 0 : 1;
            status(); ctx.end({winner: wn, text: `${st.sc[0]} : ${st.sc[1]} · 共 ${st.round} 回合 · ${ctx.name(wn)} 最长连中 ${st.best[wn]} 拳 · ${ctx.name(1 - wn)} 罚酒 ${st.sc[wn]} 杯`, delay: 1900});
          }
        } else if (a.t === 'next') {
          if (st.ph !== 'show') return;
          st.ph = 'pick'; st.pick = [null, null]; st.round++; pickT0 = 0; hintA = null;
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
      onTurn: status, onView() { pickT0 = 0; status(); },
      ready() { status(); },
      showHint(a) {
        if (!a || !canPick()) return;
        hintA = {n: a.h[0] + a.h[1], c: a.c}; hintT = now();
        ctx.toast(`💡 建议：出${HANDN[hintA.n]}，喊${CALLN[a.c]}`);
      },
      frame() {
        const g = cv.g; cv.clear(); const L = layout(), t = now();
        if (beat && canPick() && !ctx.fast) {
          if (!pickT0) { pickT0 = t; beatN = -1; }
          const n = Math.floor((t - pickT0) / (BEAT / 3));
          if (n !== beatN && n < 3) { beatN = n; ctx.sfx(n === 2 ? 'gong' : 'tick'); }
          if (t - pickT0 >= BEAT) { const s = me(), h = draft[s][0] + draft[s][1]; pickT0 = 0; ctx.toast('时间到！自动喊' + CALLN[h * 5 + 5]); shout(h * 5 + 5); }
        }
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
          // name tag (beside the hands, away from the call bubble)
          const tx = A.x + A.w / 2 + (up ? -1 : 1) * (spread * .55 + L.hs * .72), al = up ? 'right' : 'left', tmw = Math.max(60, A.w / 2 - spread * .55 - L.hs * .72 - 50);
          const ty = yy + (up ? 1 : -1) * L.hs * .1;
          D.text(g, ctx.name(s), tx, ty - 9, {size: 14, color: '#f6e7c8', weight: 800, shadow: true, align: al, maxW: tmw});
          const sub = st.pick[s] && !show ? '已出手 ✓' : st.streak[s] >= 2 ? `连中 ×${st.streak[s]}` : st.sc[1 - s] ? `罚酒 ${st.sc[1 - s]} 杯` : '';
          if (sub) D.text(g, sub, tx, ty + 10, {size: 12, color: st.pick[s] && !show ? '#9fe8c0' : st.streak[s] >= 2 ? '#ffe08a' : 'rgba(246,231,200,.7)', weight: 700, shadow: true, align: al, maxW: tmw});
          if (show && call != null) {
            const by = up ? yy - L.hs * 1.0 : yy + L.hs * 1.0, k = vis.bubbles;
            const right = call === st.last.total;
            g.save(); g.translate(A.x + A.w / 2 + (up ? 1 : -1) * spread * 1.15, by); g.scale(k, k);
            bubble(g, 0, 0, CALLW[call], L.hs * .32, vis.rev >= 1 ? (right ? '#fff3c4' : '#e9e1d4') : '#fffaf0', vis.rev >= 1 && right ? '#c8a052' : null);
            g.restore();
          } else if (ctx.isLocal(s) && s === me() && canPick()) {
            const h = draft[s][0] + draft[s][1];
            D.text(g, `手上：${CALLN[h * 5]}`, A.x + A.w / 2, yy - L.hs * 1.0, {size: 14, color: '#ffe08a', weight: 700, shadow: true});
          }
        }
        // total
        if (show && vis.rev >= 1) {
          const l = st.last;
          const k = BX.clamp((t - vis.t0 - 750) / 300, 0, 1);
          g.save(); g.translate(A.x + A.w * .5, A.y + A.h * .5); g.scale(BX.ease.back(k), BX.ease.back(k));
          g.fillStyle = 'rgba(122,28,18,.92)'; D.circle(g, 0, 0, L.hs * .5); g.fill(); g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.stroke();
          D.text(g, String(l.total), 0, -L.hs * .06, {size: L.hs * .38, color: '#fff3e3', font: 'serif', weight: 900});
          D.text(g, '总数', 0, L.hs * .28, {size: L.hs * .14, color: '#e6c57d'});
          g.restore();
          if (l.w >= 0 && vis.pt) {
            const pk = (t - vis.pt) / 1200;
            if (pk < 1) {
              const bt = l.w === bot; g.globalAlpha = 1 - pk; D.text(g, '+1', A.x + 50, (bt ? A.y + A.h * .62 : A.y + A.h * .38) - pk * 20, {size: 26, color: '#ffe08a', weight: 900, stroke: '#3a1206', strokeW: 4});
              D.text(g, '罚酒一杯！', A.x + A.w / 2, (bt ? A.y + A.h * .36 : A.y + A.h * .64) - pk * 14, {size: 18, color: '#ffd0b0', weight: 900, font: 'serif', stroke: '#3a1206', strokeW: 4});
              g.globalAlpha = 1;
            }
          }
        }
        if (!L.land) drawHistCol(g, L);
        drawCtrl(g, L, t);
      },
    };
    function drawScore(g, x, y, top, bot, L) {
      const w = 34, h = Math.min(L.arena.h * .5, 210);
      g.fillStyle = 'rgba(20,10,5,.5)'; D.rr(g, x, y - h / 2, w, h, 10); g.fill();
      for (const [s, dir] of [[top, -1], [bot, 1]]) {
        for (let j = 0; j < goal; j++) {
          const cy = y + dir * (12 + j * (h / 2 - 18) / goal);
          g.fillStyle = j < st.sc[s] ? ctx.color(s) : 'rgba(246,231,200,.15)'; D.circle(g, x + w / 2, cy, 6); g.fill();
          if (j < st.sc[s]) { g.strokeStyle = '#e6c57d'; g.lineWidth = 1; g.stroke(); }
        }
      }
      g.strokeStyle = 'rgba(230,197,125,.5)'; g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + w - 6, y); g.stroke();
    }
    const resCol = r => r.w < 0 ? 'rgba(246,231,200,.25)' : ctx.color(r.w);
    function histRows() {
      return st.hist.map((r, i) => {
        const t = (r.h[0] + r.h[1]) * 5, a = r.c[0] === t, b = r.c[1] === t;
        return {i, h: r.h, c: r.c, t, w: a && !b ? 0 : b && !a ? 1 : -1};
      });
    }
    const hiding = () => st.ph === 'show' && vis.rev < 1;
    function drawHistCol(g, L) {
      const A = L.arena, all = histRows(); if (hiding()) all.pop();
      const rows = all.slice(-6);
      if (!rows.length) return;
      const w = 34, rh = 24, x = A.x + A.w - 14 - w, h = rows.length * rh + 22, y = A.y + A.h * .5 - h / 2;
      g.fillStyle = 'rgba(20,10,5,.5)'; D.rr(g, x, y, w, h, 10); g.fill();
      D.text(g, '近局', x + w / 2, y + 11, {size: 10, color: 'rgba(246,231,200,.6)'});
      rows.reverse().forEach((r, j) => {
        const cy = y + 22 + j * rh + rh / 2;
        g.fillStyle = resCol(r); D.rr(g, x + 4, cy - 9, w - 8, 18, 9); g.fill();
        D.text(g, String(r.t), x + w / 2, cy + 1, {size: 11, color: '#fff', weight: 800});
      });
    }
    function drawCtrl(g, L, t) {
      const K = L.ctrl, s = me(), can = canPick();
      D.paper(g, K.x + 6, K.y + 6, K.w - 12, K.h - 12, {r: 14, color: '#efe0bd'});
      g.strokeStyle = 'rgba(122,28,18,.45)'; g.lineWidth = 1.5; D.rr(g, K.x + 10, K.y + 10, K.w - 20, K.h - 20, 10); g.stroke();
      const hint = can ? '① 选出手' : st.ph === 'show' ? '亮手！' : st.pick[s] ? '已出手，等待对方…' : '等待…';
      D.text(g, hint, K.x + K.w / 2, L.hint, {size: 15, color: C.ink2, weight: 800});
      if (beat && can && pickT0) {   // beat bar: three beats then auto-shout
        const k = BX.clamp((t - pickT0) / BEAT, 0, 1), bw = Math.min(K.w - 40, 300), bx = K.x + (K.w - bw) / 2, by = L.hint - 18;
        g.fillStyle = 'rgba(43,33,24,.15)'; D.rr(g, bx, by, bw, 5, 2.5); g.fill();
        g.fillStyle = k > .66 ? C.red : '#c8a052'; D.rr(g, bx, by, bw * (1 - k), 5, 2.5); g.fill();
        for (let j = 1; j < 3; j++) { g.fillStyle = 'rgba(43,33,24,.4)'; g.fillRect(bx + bw * j / 3 - 1, by - 2, 2, 9); }
      }
      const hands = ctx.isLocal(s) ? draft[s] : [0, 0], hv = hands[0] + hands[1];
      const pulse = .55 + .4 * Math.sin((t - hintT) / 160);
      for (const b of L.hands) {
        const on = b.i === hv;
        g.globalAlpha = can ? 1 : .5;
        g.fillStyle = on ? 'rgba(63,127,107,.22)' : 'rgba(255,255,255,.35)'; D.rr(g, b.x, b.y, b.w, b.h, 12); g.fill();
        g.strokeStyle = on ? C.jade : 'rgba(122,28,18,.35)'; g.lineWidth = on ? 3 : 1.5; g.stroke();
        const hsz = Math.min(b.h * .34, b.w * .21), hy = b.y + b.h * .4;
        for (let j = 0; j < 2; j++) { g.save(); g.translate(b.x + b.w / 2 + (j ? 1 : -1) * hsz * .62, hy); g.scale(j ? -1 : 1, 1); drawHand(g, 0, 0, hsz, !!HANDS[b.i][j], 0, s === 0 ? '#f0c9a0' : '#e3b386', false, ctx.color(s)); g.restore(); }
        D.text(g, HANDN[b.i] + ' ' + b.i * 5, b.x + b.w / 2, b.y + b.h - 11, {size: BX.clamp(b.w * .12, 11, 14), color: on ? C.jade : C.ink, weight: 800, maxW: b.w - 6});
        if (hintA && can && hintA.n === b.i) { g.strokeStyle = `rgba(63,160,120,${pulse})`; g.lineWidth = 4; D.rr(g, b.x - 3, b.y - 3, b.w + 6, b.h + 6, 14); g.stroke(); }
        g.globalAlpha = 1;
      }
      const showOdds = ctx.pref('hints') && can;
      for (const b of L.calls) {
        const ok = can && okCall(hv, b.c);
        g.globalAlpha = ok ? 1 : .32;
        g.fillStyle = '#6e1d14'; D.rr(g, b.x, b.y + 3, b.w, b.h - 3, 10); g.fill();
        const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, '#d0533f'); gr.addColorStop(1, '#a33022');
        g.fillStyle = gr; D.rr(g, b.x, b.y, b.w, b.h - 4, 10); g.fill();
        D.text(g, CALLN[b.c], b.x + b.w / 2, b.y + (b.h - 4) / 2 - (showOdds && ok ? 6 : 0), {size: Math.min(21, b.w * .32), color: '#fff3e3', font: 'serif', weight: 900});
        if (showOdds && ok) D.text(g, Math.round(ODD[b.c / 5 - hv] * 100) + '%', b.x + b.w / 2, b.y + b.h - 14, {size: 11, color: 'rgba(255,243,227,.85)', weight: 700});
        g.globalAlpha = 1;
        if (hintA && can && hintA.c === b.c) { g.strokeStyle = `rgba(63,160,120,${pulse})`; g.lineWidth = 4; D.rr(g, b.x - 3, b.y - 3, b.w + 6, b.h + 2, 12); g.stroke(); }
      }
      if (can && L.hint2 < K.y + K.h - 10) D.text(g, '② 点数字喊出（即出手）', K.x + K.w / 2, L.hint2, {size: 12, color: C.ink2});
      // round history (landscape panel)
      const Hh = L.hist;
      if (Hh && Hh.h > 60) {
        const rows = histRows(); if (hiding()) rows.pop();
        const lh = 22, maxN = Math.floor((Hh.h - 26) / lh), op = 1 - s;
        g.strokeStyle = 'rgba(122,28,18,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Hh.x, Hh.y); g.lineTo(Hh.x + Hh.w, Hh.y); g.stroke();
        D.text(g, '对局记录', Hh.x + 2, Hh.y + 13, {size: 12, color: C.ink2, align: 'left', font: 'serif', weight: 700});
        D.text(g, `${ctx.name(s)} | ${ctx.name(op)}`, Hh.x + Hh.w, Hh.y + 13, {size: 11, color: C.ink2, align: 'right', maxW: Hh.w * .6});
        if (!rows.length) D.text(g, '尚无回合', Hh.x + Hh.w / 2, Hh.y + 40, {size: 12, color: C.ink2});
        rows.slice(-maxN).reverse().forEach((r, j) => {
          const y = Hh.y + 36 + j * lh; g.globalAlpha = j ? .8 : 1;
          D.text(g, String(r.i + 1), Hh.x + 10, y, {size: 11, color: C.ink2});
          D.text(g, `出${r.h[s] * 5} 喊${CALLN[r.c[s]]}`, Hh.x + 26, y, {size: 12, color: r.w === s ? C.jade : C.ink, align: 'left', weight: r.w === s ? 800 : 400, maxW: Hh.w * .38});
          D.text(g, `出${r.h[op] * 5} 喊${CALLN[r.c[op]]}`, Hh.x + Hh.w * .46, y, {size: 12, color: r.w === op ? C.red : C.ink, align: 'left', weight: r.w === op ? 800 : 400, maxW: Hh.w * .36});
          g.fillStyle = resCol(r); D.rr(g, Hh.x + Hh.w - 34, y - 9, 32, 18, 9); g.fill();
          D.text(g, String(r.t), Hh.x + Hh.w - 18, y + 1, {size: 11, color: r.w < 0 ? C.ink : '#fff', weight: 800});
          g.globalAlpha = 1;
        });
      }
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
