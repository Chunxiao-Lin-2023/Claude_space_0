/* 吹牛骰 — Perudo / 大话骰: hidden dice under cups, rising bids, 1s wild, call 开. */
const D = BX.draw, C = BX.C;
const PCOL = ['#c23a2b', '#2f5d8a', '#3f8f5b', '#d9a12b'];
const ceilHalf = q => Math.ceil(q / 2);
/* is bid b = {q,f} a legal raise over prev (or a legal opening when prev is null)? */
function legalBid(b, prev, total) {
  if (!b || !Number.isInteger(b.q) || !Number.isInteger(b.f) || b.f < 1 || b.f > 6 || b.q < 1 || b.q > total) return false;
  if (!prev) return b.f !== 1;
  if (prev.f !== 1) { if (b.f === 1) return b.q >= ceilHalf(prev.q); return b.q > prev.q || (b.q === prev.q && b.f > prev.f); }
  if (b.f === 1) return b.q > prev.q;
  return b.q >= prev.q * 2 + 1;
}
function minQ(f, prev) {
  if (!prev) return 1;
  if (prev.f !== 1) return f === 1 ? ceilHalf(prev.q) : f > prev.f ? prev.q : prev.q + 1;
  return f === 1 ? prev.q + 1 : prev.q * 2 + 1;
}
const countFace = (dice, f) => dice.filter(v => v === f || (f !== 1 && v === 1)).length;
function binomTail(n, k, p) {
  if (k <= 0) return 1; if (k > n) return 0;
  let s = 0, c = 1;
  for (let i = 0; i <= n; i++) { if (i >= k) s += c * Math.pow(p, i) * Math.pow(1 - p, n - i); c = c * (n - i) / (i + 1); }
  return s;
}

BX.register({
  id: 'liarsdice', title: '吹牛骰', cat: 'dice', order: 2, sub: '扣盅叫数，敢叫就敢开',
  desc: '每人五颗骰子扣在盅里，只看得到自己的。轮流叫“几个几”，越叫越大，觉得对方在吹牛就喊“开”！输的人丢一颗骰子，最后还有骰子的人获胜。',
  kind: 'turn', seats: [2, 4], defSeats: 2, hidden: true, seatColors: PCOL, firstLabel: '先叫', aiDelay: 650, anyTimeActs: true,
  rules: `<p>每人 <b>5 颗骰子</b>扣在骰盅里，摇过后只能偷看自己的。</p>
<p>由一位玩家先<b>叫数</b>，如“4 个 5”，意思是：<b>全场所有骰子</b>里至少有 4 颗是 5。之后按顺序，下一位玩家必须二选一：</p>
<ul><li><b>加叫</b>：数量更多（点数任意），或数量相同而点数更大；</li>
<li><b>开</b>：不相信上家，所有人揭盅清点。</li></ul>
<p><b>1 点是百搭</b>，清点时算作任何点数——除非叫的就是 1 点（叫“斋”）。<br>
从普通点数改叫 1 点时，数量可以<b>减半（向上取整）</b>，如“7 个 4”之后可叫“4 个 1”；从 1 点改回普通点数时，数量至少为<b>两倍加一</b>，如“3 个 1”之后至少要叫“7 个 X”。每轮第一口不能叫 1 点。</p>
<p>揭盅后若实际数量<b>达到</b>叫数，则喊开的人输；否则叫数的人输。输家<b>丢掉一颗骰子</b>，并由他开始下一轮（若他已出局则由下一位开始）。骰子丢光即出局，<b>最后还有骰子的玩家获胜</b>。</p>
<p>操作：选点数和数量后点「叫」，或点「开」。同屏多人时每次轮换会提示交接设备。</p>`,
  icon(g, w, h) {
    D.felt(g, 0, 0, w, h, {color: '#6a1f1a'});
    // cup
    const cx = w * .3, cy = h * .62;
    const gr = g.createLinearGradient(cx - 40, 0, cx + 40, 0); gr.addColorStop(0, '#5a120c'); gr.addColorStop(.45, '#c23a2b'); gr.addColorStop(1, '#4a0e08');
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 30, cy - 62); g.lineTo(cx + 30, cy - 62); g.lineTo(cx + 44, cy + 20); g.lineTo(cx - 44, cy + 20); g.closePath(); g.fill();
    g.fillStyle = C.gold; g.fillRect(cx - 46, cy + 14, 92, 9); g.fillRect(cx - 31, cy - 64, 62, 6);
    D.text(g, '吹', cx, cy - 22, {size: 30, color: C.gold2, font: 'serif', weight: 900});
    [[.62, .48, 5, .2], [.78, .58, 1, -.3], [.66, .74, 5, .1]].forEach(([x, y, v, r]) => D.die(g, w * x - 17, h * y - 17, 34, v, {rot: r}));
    D.text(g, '3个5?', w * .8, h * .2, {size: 22, color: '#ffe6a8', font: 'deco', weight: 400});
  },
  create(ctx) {
    const N = ctx.n;
    const st = {dice: BX.range(N).map(() => []), cnt: new Array(N).fill(5), turn: 0, bid: null, hist: [], phase: 'bid', res: null, round: 1, out: [], over: false};
    const total = () => st.cnt.reduce((a, b) => a + b, 0);
    const alive = s => st.cnt[s] > 0;
    const nextAlive = s => { for (let k = 1; k <= N; k++) { const t = (s + k) % N; if (alive(t)) return t; } return s; };
    function rollAll() { for (let s = 0; s < N; s++) { st.dice[s] = []; for (let i = 0; i < st.cnt[s]; i++) st.dice[s].push(1 + ctx.rng.int(6)); st.dice[s].sort((a, b) => a - b); } }
    st.turn = ctx.rng.int(N); rollAll();
    const cv = ctx.canvas();
    let sel = {q: 1, f: 2}, selFor = -1, btns = [], t = 0, cupK = 0, shake = {k: 1, id: 0}, bidPop = {k: 1};
    const myTurn = () => st.phase === 'bid' && !st.over && ctx.canAct(st.turn);
    function resetSel() {
      const prev = st.bid, T = total(), myD = st.dice[st.turn] || [];
      // suggest the face we hold most of (by count incl. wilds), at its minimal legal quantity
      let best = null;
      for (let f = 2; f <= 6; f++) { const q = minQ(f, prev); if (q <= T && legalBid({q, f}, prev, T)) { const sc = countFace(myD, f); if (!best || sc > best.sc) best = {q, f, sc}; } }
      if (!best && prev) { const q = minQ(1, prev); if (q <= T) best = {q, f: 1}; }
      sel = best ? {q: best.q, f: best.f} : {q: Math.min(T, (prev ? prev.q : 0) + 1), f: 2};
      selFor = st.hist.length * 10 + st.round * 1000 + st.turn;
    }
    /* ---------- layout ---------- */
    function layout() {
      const W = cv.w, H = cv.h, land = W > H * 1.2;
      if (land) { const pw = Math.min(330, W * .4); return {land, table: {x: 6, y: 6, w: W - pw - 18, h: H - 12}, panel: {x: W - pw - 6, y: 6, w: pw, h: H - 12}}; }
      const ph = Math.min(220, Math.max(176, H * .27)); return {land, table: {x: 6, y: 6, w: W - 12, h: H - ph - 16}, panel: {x: 6, y: H - ph - 6, w: W - 12, h: ph}};
    }
    // seat positions around the table, viewer at the bottom
    function seatPos(s, tb) {
      const me = ctx.view >= 0 ? ctx.view : 0, rel = (s - me + N) % N;
      const cx = tb.x + tb.w / 2, cy = tb.y + tb.h / 2;
      if (rel === 0) return {x: cx, y: tb.y + tb.h * .8, me: true};
      if (N === 2) return {x: cx, y: tb.y + tb.h * .2};
      if (N === 3) return rel === 1 ? {x: tb.x + tb.w * .25, y: tb.y + tb.h * .22} : {x: tb.x + tb.w * .75, y: tb.y + tb.h * .22};
      return rel === 1 ? {x: tb.x + tb.w * .17, y: cy - tb.h * .06} : rel === 2 ? {x: cx, y: tb.y + tb.h * .2} : {x: tb.x + tb.w * .83, y: cy - tb.h * .06};
    }
    /* ---------- input ---------- */
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e);
      for (const b of btns) if (b.on && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.fn(); return; }
    });
    /* ---------- status ---------- */
    const bidTxt = b => b.q + ' 个 ' + (b.f === 1 ? '1（斋）' : b.f);
    const status = () => {
      for (let s = 0; s < N; s++) ctx.info(s, alive(s) ? st.cnt[s] + ' 骰' : '出局');
      if (st.over) return ctx.status('终局');
      if (st.phase === 'reveal') { const r = st.res; return ctx.status('揭盅！共 ' + r.count + ' 个 ' + r.f + ' · ' + ctx.name(r.loser) + ' 丢一颗骰子'); }
      const head = '第 ' + st.round + ' 轮 · ' + (st.bid ? '现叫 <b>' + bidTxt(st.bid) + '</b> · ' : '');
      ctx.status(head + (myTurn() ? (ctx.hotseat ? ctx.name(st.turn) + '：' : '轮到你：') + (st.bid ? '加叫或开' : '先叫') : '等待 ' + ctx.name(st.turn) + '…'));
    };
    /* ---------- AI ---------- */
    function aiMove(seat, level) {
      const T = total(), mine = st.dice[seat], U = T - mine.length, prev = st.bid;
      const inferred = f => {   // level 3: other players' bids hint at their hands
        if (level < 3) return 0; let s = 0; const seen = new Set();
        for (const h of st.hist) if (h.by !== seat && !seen.has(h.by) && (h.f === f || (f !== 1 && h.f === 1))) { seen.add(h.by); s += Math.min(1.2, st.cnt[h.by] * .28); }
        return s;
      };
      const pTrue = b => { const known = countFace(mine, b.f) + inferred(b.f); return binomTail(U, Math.ceil(b.q - known - 1e-9), b.f === 1 ? 1 / 6 : 1 / 3); };
      const cands = [];
      for (let f = 1; f <= 6; f++) { const q0 = minQ(f, prev); for (let q = q0; q <= Math.min(T, q0 + 2); q++) if (legalBid({q, f}, prev, T)) cands.push({q, f}); }
      if (level === 1) {
        if (prev) {
          const exp = countFace(mine, prev.f) + U / (prev.f === 1 ? 6 : 3);
          if (prev.q > exp + .6 + Math.random() * 1.5 || !cands.length) return {t: 'call'};
        }
        let bf = 2, bc = -1; for (let f = 2; f <= 6; f++) { const c = countFace(mine, f) + Math.random() * 1.5; if (c > bc) { bc = c; bf = f; } }
        const okc = cands.filter(c => c.f === bf); const pick = okc.length ? okc[0] : cands[Math.floor(Math.random() * cands.length)];
        if (!prev) return {t: 'bid', q: Math.max(1, Math.round(T / 4 + Math.random())), f: bf};
        return {t: 'bid', q: pick.q, f: pick.f};
      }
      if (!prev) {
        // opening: face we hold most of, quantity a bit under expectation
        let best = null;
        for (let f = 2; f <= 6; f++) { const k = countFace(mine, f); const q = Math.max(1, Math.floor(k + U / 3 * (level >= 3 ? .8 : .6))); const sc = k + Math.random() * .8; if (!best || sc > best.sc) best = {q, f, sc}; }
        if (level >= 3 && Math.random() < .15) { const f = 2 + Math.floor(Math.random() * 5); best = {q: Math.max(1, Math.floor(U / 3)), f}; }   // bluff opening
        return {t: 'bid', q: Math.min(T, best.q), f: best.f};
      }
      const pPrev = pTrue(prev);
      const scored = cands.map(c => [c, pTrue(c) - (c.q - minQ(c.f, prev)) * .04 + (level >= 3 ? countFace(mine, c.f) * .015 : 0)]);
      scored.sort((a, b) => b[1] - a[1]);
      const bestRaise = scored.length ? scored[0] : null;
      const thr = level >= 3 ? .42 : .38;
      if (!bestRaise || (pPrev < thr && (!bestRaise || bestRaise[1] < pPrev + .35)) || (bestRaise && bestRaise[1] < .2 && pPrev < .55)) return {t: 'call'};
      if (level >= 3 && Math.random() < .14 && scored.length > 2) {   // bluff: plausible-looking raise on a face we don't hold
        const bl = scored.filter(([c, v]) => v > .3 && countFace(mine, c.f) <= 1);
        if (bl.length) { const c = bl[0][0]; return {t: 'bid', q: c.q, f: c.f}; }
      }
      const c = level === 2 && Math.random() < .25 && scored.length > 1 ? scored[1][0] : bestRaise[0];
      return {t: 'bid', q: c.q, f: c.f};
    }
    /* ---------- apply ---------- */
    const inst = {
      st,
      toMove: () => st.over || st.phase !== 'bid' ? null : st.turn,
      valid(a, by) { if (st.phase !== 'bid' || by !== st.turn || st.over) return false; if (a.t === 'call') return !!st.bid; return a.t === 'bid' && legalBid(a, st.bid, total()); },
      sysMove: () => st.phase === 'reveal' && !st.over ? {a: {t: 'next'}, delay: 3400} : null,
      apply(a, by) {
        if (a.t === 'bid') {
          st.bid = {q: a.q, f: a.f, by: st.turn}; st.hist.push({by: st.turn, q: a.q, f: a.f});
          ctx.sfx('chip'); bidPop = {k: 0}; const bp = bidPop; ctx.anim(320, k => bp.k = k, null, BX.ease.back);
          st.turn = nextAlive(st.turn); status(); return;
        }
        if (a.t === 'call') {
          const b = st.bid, all = [].concat(...st.dice), count = all.filter(v => v === b.f || (b.f !== 1 && v === 1)).length;
          const loser = count >= b.q ? st.turn : b.by;
          st.res = {caller: st.turn, bidder: b.by, q: b.q, f: b.f, count, loser};
          st.phase = 'reveal'; ctx.sfx('gong'); cupK = 0; ctx.anim(700, k => cupK = k, () => ctx.sfx(loser === st.turn ? 'buzz' : 'score'), BX.ease.out);
          status(); return;
        }
        if (a.t === 'next') {
          const L = st.res.loser; st.cnt[L]--;
          if (!st.cnt[L]) st.out.push(L);
          const left = BX.range(N).filter(alive);
          if (left.length === 1) {
            st.over = true; st.phase = 'over'; status();
            ctx.end({winner: left[0], text: ctx.name(left[0]) + ' 笑到了最后（剩 ' + st.cnt[left[0]] + ' 颗骰子）'});
            return;
          }
          st.turn = alive(L) ? L : nextAlive(L);
          st.bid = null; st.hist = []; st.res = null; st.phase = 'bid'; st.round++;
          rollAll(); ctx.sfx('dice'); shake = {k: 0, id: st.round}; const sh = shake; ctx.anim(650, k => sh.k = k);
          status();
        }
      },
      aiMove,
      onTurn: status,
      onView() { selFor = -1; },
      frame(dt) {
        const g = cv.g; cv.clear(); t += dt; btns = [];
        const L = layout(), tb = L.table;
        /* table */
        D.wood(g, tb.x, tb.y, tb.w, tb.h, {r: 22, seed: 13, base: '#6b3418', dark: '#2e1206'});
        D.felt(g, tb.x + 12, tb.y + 12, tb.w - 24, tb.h - 24, {r: 16, color: '#7a2a20'});
        g.strokeStyle = 'rgba(230,197,125,.35)'; g.lineWidth = 2; D.rr(g, tb.x + 20, tb.y + 20, tb.w - 40, tb.h - 40, 12); g.stroke();
        const unit = Math.min(tb.w / (N > 2 ? 7.5 : 6), tb.h / 5.2), reveal = st.phase === 'reveal' || st.phase === 'over' && st.res;
        const Z = BX.clamp(Math.min(tb.w, tb.h * 1.3) / 440, .8, 1.7);
        /* seats */
        for (let s = 0; s < N; s++) {
          const P = seatPos(s, tb), isMe = P.me && ctx.isLocal(ctx.view);
          const side = N === 4 && !P.me && Math.abs(P.x - (tb.x + tb.w / 2)) > tb.w * .2;
          const maxRow = P.me || N === 2 ? tb.w * .8 : side ? tb.w * .31 : tb.w * .45;
          const ds = Math.min(isMe ? unit * .56 : unit * .36, (isMe ? 48 : 30) * Z, maxRow / (Math.max(1, st.dice[s].length) * 1.18 * 1.5 + .9)), turnNow = st.turn === s && st.phase === 'bid' && !st.over;
          // name plate
          const nw = Math.min(tb.w * .42, 150 * Math.min(Z, 1.3)), ny = P.me ? P.y + Math.max(unit * .62, ds * .5 + 22) : P.y - Math.max(unit * .9, ds * 1.7 + 14);
          g.fillStyle = turnNow ? 'rgba(230,197,125,.9)' : 'rgba(20,10,5,.55)'; D.rr(g, P.x - nw / 2, ny - 13, nw, 26, 13); g.fill();
          g.fillStyle = PCOL[s]; D.circle(g, P.x - nw / 2 + 13, ny, 6); g.fill();
          D.text(g, ctx.name(s) + (alive(s) ? '' : '（出局）'), P.x + 6, ny, {size: 13, color: turnNow ? C.ink : '#f3e2c0', weight: 700, maxW: nw - 34});
          if (!alive(s) && !(reveal && st.res && st.res.loser === s)) { D.text(g, '出局', P.x, P.y, {size: unit * .4, color: 'rgba(243,226,192,.35)', font: 'deco', weight: 400}); continue; }
          const dice = st.dice[s], n = dice.length, show = reveal || isMe;
          const gap = ds * .18, dw = n * ds + (n - 1) * gap, dx = P.x - dw / 2, dy = P.y - ds / 2;
          // dice (visible ones)
          if (show) for (let i = 0; i < n; i++) {
            const v = dice[i], hit = reveal && st.res && (v === st.res.f || (st.res.f !== 1 && v === 1));
            let rot = 0, yy = dy; if (shake.k < 1) { rot = Math.sin(t * 40 + i) * .4 * (1 - shake.k); yy += Math.sin(t * 30 + i * 2) * 3 * (1 - shake.k); }
            const dim = reveal && !hit;
            g.globalAlpha = dim ? .45 : 1;
            D.die(g, dx + i * (ds + gap), yy, ds, v, {rot, sel: hit ? '#ffd76a' : false});
            g.globalAlpha = 1;
          }
          // cup
          const cupW = Math.max(dw + ds * .5, ds * 2.4), cupH = ds * 1.7;
          // cup: closed over the dice, or opened (small, set aside next to the dice)
          const open = isMe ? 1 : reveal ? cupK : 0, ow = ds * 2.1, sc = BX.lerp(1, ow / cupW, open);
          let off = open * (dw / 2 + ow / 2 + ds * .35);
          if (!P.me && P.x < tb.x + tb.w / 2 - 5) off = -off;
          if (P.x + off + ow / 2 > tb.x + tb.w - 14) off = -Math.abs(off);
          if (P.x + off - ow / 2 < tb.x + 14) off = Math.abs(off);
          const lift = Math.sin(open * Math.PI) * cupH * .5;
          drawCup(g, P.x + off, dy + ds - lift, cupW * sc, cupH * sc, s, shake.k < 1 && !reveal ? Math.sin(t * 35) * .08 * (1 - shake.k) : 0, 0, !show ? n : 0);
          // speech bubble with the player's last bid this round
          const last = [...st.hist].reverse().find(h => h.by === s);
          if (last && !reveal) {
            const bx = P.me ? P.x - cupW * .9 - 10 : P.x + cupW / 2 + 8, by = P.me ? dy - ds * .2 : dy - ds * .6;
            const isCur = st.bid && st.bid.by === s;
            const zb = Math.min(Z, 1.4), bw = 74 * zb, bh = 34 * zb, x = P.me ? bx - bw : bx;
            const bxx = Math.max(tb.x + 16, Math.min(tb.x + tb.w - bw - 16, x));
            g.fillStyle = isCur ? '#fffaf0' : 'rgba(255,250,240,.55)'; D.rr(g, bxx, by, bw, bh, 10 * zb); g.fill();
            D.text(g, last.q + ' 个', bxx + 26 * zb, by + bh / 2, {size: 14 * zb, color: C.ink, weight: 800});
            D.die(g, bxx + 46 * zb, by + 6 * zb, 22 * zb, last.f);
          }
          if (reveal && st.res && st.res.loser === s) D.text(g, '−1', P.x, P.me ? dy - 16 : dy + ds + 18, {size: 22, color: '#ffd0a0', weight: 900, stroke: '#5a120c', strokeW: 4});
        }
        /* centre: current bid */
        const cx = tb.x + tb.w / 2, cy = tb.y + tb.h * (N === 2 ? .5 : .52);
        if (reveal && st.res) {
          const r = st.res, ok = r.count >= r.q;
          const zr = Math.min(Z, 1.35, (tb.w - 40) / 250);
          g.save(); g.translate(cx, cy); g.scale(zr, zr);
          g.fillStyle = 'rgba(20,10,5,.7)'; D.rr(g, -120, -40, 240, 80, 14); g.fill();
          D.text(g, '叫 ' + r.q + ' 个 ' + r.f + ' · 实有 ' + r.count + ' 个', 0, -14, {size: 16, color: '#f3e2c0', weight: 700});
          D.text(g, ok ? '叫数成立 · ' + ctx.name(r.caller) + ' 开错了' : '吹牛被识破 · ' + ctx.name(r.bidder) + ' 输', 0, 14, {size: 15, color: ok ? '#9fe0c4' : '#ffb39a', weight: 800, maxW: 228});
          g.restore();
        } else if (st.bid) {
          const k = bidPop.k, z = (.8 + .2 * k) * Math.min(Z, 1.35);
          g.save(); g.translate(cx, cy); g.scale(z, z);
          g.fillStyle = 'rgba(255,250,240,.92)'; D.rr(g, -78, -30, 156, 60, 14); g.fill(); g.strokeStyle = C.gold; g.lineWidth = 2; g.stroke();
          D.text(g, st.bid.q, -40, 0, {size: 34, color: C.red, weight: 900, font: 'serif'});
          D.text(g, '个', -10, 2, {size: 16, color: C.ink2, weight: 700});
          D.die(g, 10, -20, 40, st.bid.f);
          g.restore();
          D.text(g, '全场共 ' + total() + ' 颗骰子', cx, cy + 44 * Math.min(Z, 1.35), {size: 12, color: 'rgba(243,226,192,.7)', weight: 500});
        } else if (st.phase === 'bid') {
          D.text(g, '等待开口叫数', cx, cy, {size: 17, color: 'rgba(243,226,192,.75)', font: 'deco', weight: 400});
          D.text(g, '全场共 ' + total() + ' 颗骰子', cx, cy + 26, {size: 12, color: 'rgba(243,226,192,.6)', weight: 500});
        }
        /* control panel */
        drawPanel(g, L.panel);
      },
    };
    function drawCup(g, x, yb, w, h, s, rot, _a, nHidden) {
      g.save(); g.translate(x, yb); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(4, 3, w * .55, h * .12, 0, 0, Math.PI * 2); g.fill();
      const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#3a0c08'); gr.addColorStop(.4, D.shade(PCOL[s], -10)); gr.addColorStop(.6, D.shade(PCOL[s], 10)); gr.addColorStop(1, '#2a0805');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-w * .36, -h); g.lineTo(w * .36, -h); g.lineTo(w * .5, 0); g.lineTo(-w * .5, 0); g.closePath(); g.fill();
      g.fillStyle = C.gold; g.fillRect(-w * .52, -h * .12, w * 1.04, h * .12); g.fillRect(-w * .37, -h - h * .06, w * .74, h * .08);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w * .2, -h * .9, w * .06, h * .7);
      if (nHidden) D.text(g, '×' + nHidden, 0, -h * .52, {size: Math.max(12, h * .32), color: C.gold2, weight: 800});
      g.restore();
    }
    function button(g, x, y, w, h, label, o = {}) {
      const on = o.on !== false;
      g.save(); g.globalAlpha = on ? 1 : .38;
      const c1 = o.c1 || '#e6c57d', c2 = o.c2 || '#c8a052', sh = o.sh || '#8a6a2c';
      g.fillStyle = sh; D.rr(g, x, y + 3, w, h, 10); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; D.rr(g, x, y, w, h, 10); g.fill();
      if (o.sel) { g.strokeStyle = '#fff3c4'; g.lineWidth = 3; D.rr(g, x - 1, y - 1, w + 2, h + 2, 11); g.stroke(); }
      if (label) D.text(g, label, x + w / 2, y + h / 2 + 1, {size: o.size || Math.min(18, h * .42), color: o.fg || '#3a2410', weight: 800});
      g.restore();
      btns.push({x, y: y - 2, w, h: h + 6, on, fn: o.fn || (() => {})});
    }
    function drawPanel(g, P) {
      g.fillStyle = 'rgba(30,18,8,.88)'; D.rr(g, P.x, P.y, P.w, P.h, 14); g.fill();
      g.strokeStyle = 'rgba(230,197,125,.3)'; g.lineWidth = 1; g.stroke();
      const T = total(), prev = st.bid, can = myTurn();
      if (can && selFor !== st.hist.length * 10 + st.round * 1000 + st.turn) resetSel();
      const pad = 10, iw = P.w - pad * 2;
      const fw0 = Math.min((iw - 30) / 6, 54), need = 34 + fw0 + 10 + 2 * 50 + 22;
      let y = P.y + Math.max(pad, (P.h - need) / 2);
      // title row
      const tl = st.over ? '对局结束' : st.phase === 'reveal' ? '揭盅清点中…' : can ? (prev ? '加叫或开' : '你先叫数') : '等待 ' + ctx.name(st.turn) + ' 叫数…';
      D.text(g, tl, P.x + P.w / 2, y + 10, {size: 14, color: '#f3e2c0', weight: 700}); y += 24;
      // faces
      const fw = Math.min((iw - 5 * 6) / 6, 54), fx0 = P.x + (P.w - (fw * 6 + 30)) / 2;
      for (let f = 1; f <= 6; f++) {
        const x = fx0 + (f - 1) * (fw + 6), q0 = minQ(f, prev), ok = can && q0 <= T && legalBid({q: Math.max(q0, sel.f === f ? sel.q : q0), f}, prev, T);
        g.save(); g.globalAlpha = ok ? 1 : .35;
        if (sel.f === f && can) { g.fillStyle = 'rgba(255,215,106,.35)'; D.rr(g, x - 3, y - 3, fw + 6, fw + 6, 9); g.fill(); }
        D.die(g, x + fw * .1, y + fw * .1, fw * .8, f, {sel: sel.f === f && can ? '#ffd76a' : false});
        g.restore();
        btns.push({x, y, w: fw, h: fw, on: ok, fn: () => { sel.f = f; const m = minQ(f, prev); if (!legalBid(sel, prev, T)) sel.q = Math.min(T, m); ctx.sfx('click'); }});
      }
      y += fw + 10;
      // quantity stepper + bid
      const bh = Math.max(42, Math.min(50, (P.y + P.h - y - pad) / 2 - 6));
      const stepW = 44, qW = Math.min(70, iw * .2);
      const x0 = P.x + pad;
      button(g, x0, y, stepW, bh, '−', {on: can && legalBid({q: sel.q - 1, f: sel.f}, prev, T), size: 24, fn: () => { sel.q--; ctx.sfx('tick'); }});
      g.fillStyle = 'rgba(255,250,240,.95)'; D.rr(g, x0 + stepW + 6, y, qW, bh, 10); g.fill();
      D.text(g, can ? sel.q : '-', x0 + stepW + 6 + qW / 2, y + bh / 2 - 6, {size: 22, color: C.red, weight: 900, font: 'serif'});
      D.text(g, '个', x0 + stepW + 6 + qW / 2, y + bh - 9, {size: 10, color: C.ink2, weight: 600});
      button(g, x0 + stepW + 12 + qW, y, stepW, bh, '+', {on: can && sel.q < T, size: 24, fn: () => { sel.q++; ctx.sfx('tick'); }});
      const bx = x0 + stepW * 2 + 18 + qW, bw = P.x + P.w - pad - bx;
      const okBid = can && legalBid(sel, prev, T);
      button(g, bx, y, bw, bh, can ? '叫 ' + sel.q + ' 个 ' + sel.f + (sel.f === 1 ? '(斋)' : '') : '叫', {on: okBid, c1: '#5aa08a', c2: '#3f7f6b', sh: '#23503f', fg: '#f0fff8', fn: () => ctx.act({t: 'bid', q: sel.q, f: sel.f}, st.turn)});
      y += bh + 10;
      button(g, x0, y, iw, bh, prev ? '开！（不信 ' + prev.q + ' 个 ' + prev.f + '）' : '开！', {on: can && !!prev, c1: '#d0533f', c2: '#a33022', sh: '#6e1d14', fg: '#fff3e3', fn: () => ctx.act({t: 'call'}, st.turn)});
    }
    status();
    return inst;
  },
});
