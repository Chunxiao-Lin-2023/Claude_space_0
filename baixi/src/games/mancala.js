/* 播棋 — Kalah(6,4). pits 0..5 = seat0, 6 = seat0 store, 7..12 = seat1, 13 = seat1 store. */
const D = BX.draw, C = BX.C;
const STORE = [6, 13];
const SEED_COLS = ['#c23a2b', '#d9a12b', '#3f7f6b', '#2f5d8a', '#e8e0cc', '#7a4a9a', '#d9822b', '#5aa08a'];
const own = (p, s) => s === 0 ? p >= 0 && p <= 5 : p >= 7 && p <= 12;

/* pure move: returns {b, turn, over, ops, extra, cap} on a copy (ops are for visuals) */
function sow(b0, turn, p, wantOps) {
  const b = b0.slice(), ops = wantOps ? [] : null;
  let n = b[p]; b[p] = 0; if (ops) ops.push({t: 'take', p});
  let i = p;
  while (n > 0) { i = (i + 1) % 14; if (i === STORE[1 - turn]) continue; b[i]++; n--; if (ops) ops.push({t: 'drop', p: i}); }
  let extra = false, cap = 0;
  if (i === STORE[turn]) extra = true;
  else if (own(i, turn) && b[i] === 1 && b[12 - i] > 0) {
    cap = b[12 - i] + 1; b[STORE[turn]] += cap; if (ops) ops.push({t: 'move', from: 12 - i, to: STORE[turn], cap: true}, {t: 'move', from: i, to: STORE[turn]});
    b[12 - i] = 0; b[i] = 0;
  }
  let over = false;
  const e0 = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] === 0, e1 = b[7] + b[8] + b[9] + b[10] + b[11] + b[12] === 0;
  if (e0 || e1) {
    over = true;
    for (let s = 0; s < 2; s++) for (let k = 0; k < 6; k++) { const q = s * 7 + k; if (b[q]) { b[STORE[s]] += b[q]; if (ops) ops.push({t: 'move', from: q, to: STORE[s]}); b[q] = 0; } }
  }
  return {b, turn: over ? turn : extra ? turn : 1 - turn, over, ops, extra, cap};
}
const movesOf = (b, s) => { const r = []; for (let k = 0; k < 6; k++) if (b[s * 7 + k]) r.push(s * 7 + k); return r; };

/* alpha-beta that handles extra turns (same side keeps moving) */
function search(b, turn, depth, alpha, beta, t0, lim, stat) {
  if ((++stat.n & 511) === 0 && performance.now() - t0 > lim) stat.abort = true;
  if (stat.abort) return 0;
  const ms = movesOf(b, turn);
  if (depth === 0 || !ms.length) return evalB(b, turn);
  // ordering: extra-turn moves first, then captures
  ms.sort((x, y) => prio(b, turn, y) - prio(b, turn, x));
  let best = -1e9;
  for (const m of ms) {
    const r = sow(b, turn, m, false);
    let v;
    if (r.over) v = (r.b[STORE[turn]] - r.b[STORE[1 - turn]]) * 1000;
    else if (r.turn === turn) v = search(r.b, turn, depth - 1, alpha, beta, t0, lim, stat);
    else v = -search(r.b, 1 - turn, depth - 1, -beta, -alpha, t0, lim, stat);
    if (stat.abort) return 0;
    if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break;
  }
  return best;
}
function prio(b, s, p) { const land = (p + b[p]) % 13; return (p + b[p] === STORE[s] ? 100 : 0) + (b[p] === 0 ? 0 : own(land, s) && b[land] === 0 && b[12 - land] ? 10 + b[12 - land] : 0); }
function evalB(b, s) {
  const o = 1 - s; let mine = 0, theirs = 0;
  for (let k = 0; k < 6; k++) { mine += b[s * 7 + k]; theirs += b[o * 7 + k]; }
  return (b[STORE[s]] - b[STORE[o]]) * 10 + (mine - theirs) * 2;
}

BX.register({
  id: 'mancala', title: '播棋', cat: 'brain', order: 3, sub: '撒豆入仓，多者为胜',
  desc: '古老的“播种”棋：抓起一坑的豆子逆时针逐个撒下，落进自己的仓可以再走一次，还能把对面的豆子一口吃掉。经典 Kalah 六坑四子规则。',
  kind: 'turn', seats: 2, seatNames: ['南家', '北家'], seatColors: ['#b23a2b', '#2f5d8a'], firstLabel: '先手',
  options: [{key: 'seeds', label: '每坑豆数', choices: [[3, '3 颗（快）'], [4, '4 颗（经典）'], [5, '5 颗'], [6, '6 颗（长局）']], def: 4}],
  howto: ['点自己一排（靠近你、有金圈的坑）播种。', '<b>预览</b>：鼠标悬停或触屏第一次点，会标出每个坑会多几颗、最后一颗落在哪（金圈），以及能否「再走一次」或「吃子」；再点一次确认。', '播种动画中点棋盘可直接跳到结果；键盘 1–6 从左到右选坑，回车确认。', '💡 提示会标出推荐的坑；红点标出对手上一步抓起的坑。'],
  rules: `<p>棋盘两排各 6 个小坑，两端各有一个大仓；靠近你的一排和你右手边的大仓属于你。开局每个小坑放 <b>4 颗豆</b>。</p>
<p><b>播种：</b>轮到你时，从自己一排选一个有豆的坑，把豆全部抓起，<b>逆时针</b>方向依次往后面每个坑各放一颗（经过自己的仓也放一颗，但<b>跳过对手的仓</b>）。</p>
<p><b>再走一次：</b>最后一颗豆正好落进自己的仓，可以再走一步。</p>
<p><b>吃子：</b>最后一颗豆落在自己一排<b>原本空着</b>的坑里，而对面正对的坑有豆，就把对面那坑的豆连同这颗一起收进自己的仓。</p>
<p><b>结束：</b>任意一方的六个坑全部空了，游戏结束，另一方把自己坑里剩余的豆全部收进自己的仓。仓里豆多者胜，相同为和棋。</p>
<p>操作：点自己一排的坑即可播种（触屏先预览再确认）。开局豆数可在选项中改为 3～6 颗，默认为经典的 4 颗。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#4a2f1a', '#2a190d');
    const bx = w * .06, by = h * .2, bw = w * .88, bh = h * .6;
    D.wood(g, bx, by, bw, bh, {r: bh * .3, seed: 4, base: '#c9955a'});
    const pit = (x, y, rx, ry) => { const gr = g.createRadialGradient(x, y - ry * .3, 2, x, y, rx); gr.addColorStop(0, '#5a3418'); gr.addColorStop(1, '#8a5a30'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    pit(bx + bw * .07, by + bh / 2, bw * .045, bh * .38); pit(bx + bw * .93, by + bh / 2, bw * .045, bh * .38);
    let k = 0;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const x = bx + bw * (.18 + i * .128), y = by + bh * (r ? .72 : .28); pit(x, y, bw * .052, bh * .18);
      const n = (i * 7 + r * 3) % 5 + 1;
      for (let s = 0; s < n; s++) { const a = s * 2.4, rr = Math.sqrt(s) * 3; D.disc(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8, 3, SEED_COLS[(k++) % 8], {shadow: false}); }
    }
    for (let s = 0; s < 9; s++) D.disc(g, bx + bw * .93 + (s % 2 - .5) * 6, by + bh * .25 + s * bh * .055, 3.2, SEED_COLS[s % 8], {shadow: false});
  },
  create(ctx) {
    const S0 = BX.clamp(+ctx.opts.seeds || 4, 3, 6);
    const st = {b: [S0, S0, S0, S0, S0, S0, 0, S0, S0, S0, S0, S0, S0, 0], turn: 0, last: -1, lastBy: -1, moves: 0, over: false, extra: false, cap: 0};
    const cv = ctx.canvas();
    /* ---------- visuals: individual seeds ---------- */
    let seedId = 0;
    const mkSeed = () => ({c: SEED_COLS[(seedId * 5 + (seedId >> 3)) % 8], id: seedId++, rot: Math.random() * 6});
    const vp = st.b.map(n => BX.range(n).map(mkSeed));
    let hand = [], handAt = -1, fly = [], queue = [], busy = false, flash = {p: -1, t: 0}, lastOps = [];
    function sync() { for (let p = 0; p < 14; p++) { while (vp[p].length > st.b[p]) vp[p].pop(); while (vp[p].length < st.b[p]) vp[p].push(mkSeed()); } hand = []; handAt = -1; fly = []; queue = []; busy = false; }
    const STEP = () => BX.test ? 4 : queue.length > 14 ? 60 : 150;
    function runQueue() {
      if (busy) return;
      if (!queue.length) {   // idle: reconcile visual seeds with the true state once every flight has landed
        if (fly.length) { ctx.after(40, runQueue); return; }
        hand = []; handAt = -1;
        for (let p = 0; p < 14; p++) { while (vp[p].length > st.b[p]) vp[p].pop(); while (vp[p].length < st.b[p]) vp[p].push(mkSeed()); }
        ctx.poke(); return;
      }
      if (queue.length > 40) { sync(); ctx.poke(); return; }   // fell far behind (fast replays / bots): jump to the true state
      if ((queue[0].t === 'take' || queue[0].t === 'move') && fly.length) { ctx.after(30, runQueue); return; }
      const op = queue.shift();
      busy = true;
      const next = () => { busy = false; runQueue(); };
      if (op.t === 'take') { hand = vp[op.p].splice(0); handAt = op.p; ctx.sfx('click'); ctx.after(STEP() * 1.2, next); }
      else if (op.t === 'drop') {
        const s = hand.shift(); if (!s) { next(); return; }
        const f = {s, from: handAt, to: op.p, k: 0}; fly.push(f); handAt = op.p;
        ctx.anim(STEP() * 1.4, k => f.k = k, () => { fly.splice(fly.indexOf(f), 1); vp[op.p].push(s); ctx.sfx('tick'); }, BX.ease.out);
        ctx.after(STEP(), next);
      } else if (op.t === 'move') {
        const ss = vp[op.from].splice(0); if (op.cap) { flash = {p: op.from, t: 1}; ctx.sfx('capture'); }
        ss.forEach((s, j) => { const f = {s, from: op.from, to: op.to, k: 0}; fly.push(f); ctx.after(j * 30, () => ctx.anim(STEP() * 2.6, k => f.k = k, () => { fly.splice(fly.indexOf(f), 1); vp[op.to].push(s); }, BX.ease.inOut)); });
        ctx.after(STEP() * 2.6 + ss.length * 30, next);
      }
    }
    const animating = () => busy || queue.length > 0 || fly.length > 0;

    /* ---------- layout (logical board 8×3, rotated for portrait, flipped for seat-1 viewer) ---------- */
    const viewSeat = () => ctx.hotseat ? 0 : (ctx.mySeats.length === 1 ? ctx.mySeats[0] : 0);
    function L() {
      const portrait = cv.h > cv.w * 1.1;
      const lw = portrait ? 3 : 8, lh = portrait ? 8 : 3;
      const f = BX.fit(cv.w, cv.h, lw + .3, lh + .3, 6);
      return {portrait, s: f.s, ox: f.x + .15 * f.s, oy: f.y + .15 * f.s, flip: viewSeat() === 1};
    }
    function T(x, y, l) {
      if (l.flip) { x = 8 - x; y = 3 - y; }
      if (l.portrait) { const X = 3 - y, Y = x; x = X; y = Y; }
      return [l.ox + x * l.s, l.oy + y * l.s];
    }
    function pitPos(p, l) {
      let x, y;
      if (p <= 5) { x = 1.5 + p; y = 2.05; } else if (p === 6) { x = 7.45; y = 1.5; } else if (p <= 12) { x = 6.5 - (p - 7); y = .95; } else { x = .55; y = 1.5; }
      const [X, Y] = T(x, y, l); return {x: X, y: Y, store: p === 6 || p === 13};
    }
    function seedOff(k, store, l) {   // offset of k-th seed inside a pit
      const r = l.s * .055, a = k * 2.39996, d = Math.sqrt(k + .4) * r * (store ? .95 : 1.05);
      let ox = Math.cos(a) * d, oy = Math.sin(a) * d;
      if (store) { // elongated along the store's long axis
        const lim = l.s * .3; const yy = ((k * 0.61803) % 1 - .5) * l.s * 1.4 * Math.min(1, .35 + k / 30), xx = ox * .6;
        ox = BX.clamp(xx, -lim, lim); oy = yy;
        if (l.portrait) { const t = ox; ox = oy; oy = t; }
      }
      return [ox, oy];
    }
    const pitAt = pt => { const l = L(); for (let p = 0; p < 14; p++) { if (p === 6 || p === 13) continue; const q = pitPos(p, l); if (Math.hypot(pt.x - q.x, pt.y - q.y) < l.s * .48) return p; } return -1; };
    let hover = -1, preview = -1, hint = -1, hintT = 0, call = null;
    /* move preview: per-pit +k, landing pit, capture / extra turn */
    const pvCache = {};
    function pv(p) {
      const key = p + ':' + st.moves + ':' + st.turn; if (pvCache.key === key) return pvCache.v;
      const r = sow(st.b, st.turn, p, true), add = new Array(14).fill(0); let land = -1, capFrom = -1;
      for (const o of r.ops) { if (o.t === 'drop') { add[o.p]++; land = o.p; } if (o.t === 'move' && o.cap) capFrom = o.from; }
      pvCache.key = key; pvCache.v = {add, land, cap: r.cap, capFrom, extra: r.extra && !r.over, over: r.over, gain: r.b[STORE[st.turn]] - st.b[STORE[st.turn]]};
      return pvCache.v;
    }
    const pvText = p => { const v = pv(p); return v.extra ? '落仓 · 再走一次' : v.cap ? '吃掉 ' + v.cap + ' 颗' : v.over ? '本步结束游戏' : '仓 +' + v.gain; };
    const legalPit = p => p >= 0 && own(p, st.turn) && st.b[p] > 0;
    function play(p) { preview = -1; hint = -1; ctx.act({p}, st.turn); }
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') { const h = pitAt(cv.pos(e)); if (h !== hover) { hover = h; status(); } } });
    ctx.on(cv.cv, 'pointerleave', () => { hover = -1; status(); });
    ctx.on(cv.cv, 'pointerdown', e => {
      if (animating()) { if (!BX.test) { sync(); ctx.poke(); } return; }   // tap to skip the sowing animation
      if (!ctx.canAct(st.turn)) return;
      const p = pitAt(cv.pos(e)); if (p < 0) { if (preview >= 0) { preview = -1; status(); } return; }
      if (!legalPit(p)) { ctx.sfx('error'); ctx.buzz(12); return; }
      if (ctx.needConfirm(e) && preview !== p) { preview = p; ctx.sfx('tick'); status(); return; }
      play(p);
    });
    function key(e) {
      if (!ctx.canAct(st.turn) || animating()) return;
      const m = /^(?:Digit|Numpad)([1-6])$/.exec(e.code);
      if (m) {   // 1..6 = left→right as seen on screen
        const l = L(), mine = BX.range(6).map(k => st.turn * 7 + k).sort((a, b) => { const A = pitPos(a, l), B = pitPos(b, l); return l.portrait ? A.y - B.y : A.x - B.x; });
        const p = mine[+m[1] - 1]; if (!legalPit(p)) { ctx.sfx('error'); return; }
        if (preview === p) play(p); else { preview = p; ctx.sfx('tick'); status(); }
      } else if ((e.code === 'Enter' || e.code === 'Space') && preview >= 0) play(preview);
      else if (e.code === 'Escape') { preview = -1; status(); }
    }

    const status = () => {
      ctx.info(0, '仓 ' + st.b[6]); ctx.info(1, '仓 ' + st.b[13]);
      if (st.over) return ctx.status(st.b[6] === st.b[13] ? '和棋' : ctx.name(st.b[6] > st.b[13] ? 0 : 1) + ' 获胜');
      const pre = st.extra ? '<b style="color:#e6c57d">落仓再走！</b> ' : st.cap ? '<b style="color:#e6c57d">' + (st.lastBy === st.turn || !ctx.canAct(st.turn) ? '吃 ' : '被吃 ') + st.cap + ' 颗！</b> ' : '';
      const pp = preview >= 0 ? preview : hover;
      const tail = ctx.canAct(st.turn) && legalPit(pp) ? ' · ' + pvText(pp) + (preview >= 0 ? '（再点确认）' : '') : '';
      ctx.status(pre + (ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + ' 播种' : '轮到你播种') : '等待 ' + ctx.name(st.turn) + '…') + tail);
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => Number.isInteger(a.p) && own(a.p, st.turn) && st.b[a.p] > 0,
      apply(a) {
        const r = sow(st.b, st.turn, a.p, true);
        const mover = st.turn;
        st.b = r.b; st.last = a.p; st.lastBy = mover; st.moves++; st.extra = r.extra && !r.over; st.cap = r.cap; preview = -1; hint = -1;
        if (ctx.fast) sync(); else {
          queue.push(...r.ops); lastOps = r.ops; runQueue();
          const done = STEP() * (r.ops.length + 1);
          if (r.extra && !r.over) ctx.after(done, () => { ctx.sfx('bell'); callout('再走一次！', mover); });
          if (r.cap) ctx.after(done, () => { callout('吃 ' + r.cap + ' 颗！', mover); if (!ctx.isLocal(mover) && ctx.isLocal(1 - mover)) ctx.buzz(25); });
        }
        if (r.over) {
          st.over = true; status();
          const d = st.b[6] - st.b[13];
          ctx.end({winner: d > 0 ? 0 : d < 0 ? 1 : -1, text: ctx.name(0) + ' ' + st.b[6] + ' : ' + st.b[13] + ' ' + ctx.name(1), delay: ctx.fast ? 0 : 900 + STEP() * r.ops.length * 1.5});
          return;
        }
        st.turn = r.turn; void mover; status();
      },
      async aiMove(seat, level) {
        // let the sowing animation finish so moves are readable
        for (let k = 0; k < 200 && animating() && !BX.test; k++) await BX.sleep(50);
        const ms = movesOf(st.b, seat);
        if (ms.length === 1) return {p: ms[0]};
        if (level === 1) {
          if (Math.random() < .45) return {p: ms[(Math.random() * ms.length) | 0]};
          const sc = ms.map(m => [m, search(st.b, seat, 1, -1e9, 1e9, performance.now(), 99, {n: 0})]);
          return {p: BX.ai.byLevel(sc.map(([m]) => { const r = sow(st.b, seat, m, false); return [m, r.turn === seat ? evalB(r.b, seat) + 15 : evalB(r.b, seat)]; }), 1)};
        }
        const lim = BX.test ? 40 : level === 2 ? 250 : 700, maxD = level === 2 ? 6 : 30, t0 = performance.now();
        let best = ms[0];
        for (let d = 1; d <= maxD; d++) {
          const stat = {n: 0, abort: false}; let bd = null, bv = -1e9, alpha = -1e9;
          const order = ms.slice().sort((x, y) => (x === best ? -1 : y === best ? 1 : prio(st.b, seat, y) - prio(st.b, seat, x)));
          for (const m of order) {
            const r = sow(st.b, seat, m, false);
            let v;
            if (r.over) v = (r.b[STORE[seat]] - r.b[STORE[1 - seat]]) * 1000;
            else if (r.turn === seat) v = search(r.b, seat, d - 1, alpha, 1e9, t0, lim, stat);
            else v = -search(r.b, 1 - seat, d - 1, -1e9, -alpha, t0, lim, stat);
            if (stat.abort) break;
            if (v > bv) { bv = v; bd = m; } if (v > alpha) alpha = v;
          }
          if (stat.abort) break;
          best = bd;
          if (performance.now() - t0 > lim * .5) break;
        }
        return {p: best};
      },
      onTurn: status,
      key,
      showHint(a) { hint = a.p; hintT = performance.now(); preview = -1; },
      frame(dt) {
        if (!busy && !queue.length && !fly.length && (hand.length || vp.some((a, p) => a.length !== st.b[p]))) runQueue();
        const g = cv.g; cv.clear(); const l = L(), s = l.s;
        const [ax, ay] = T(0, 0, l), [bx, by] = T(8, 3, l);
        const x0 = Math.min(ax, bx), y0 = Math.min(ay, by), bw = Math.abs(bx - ax), bh = Math.abs(by - ay);
        // board
        g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = s * .3; g.shadowOffsetY = s * .08; g.fillStyle = '#6b4426'; D.rr(g, x0, y0, bw, bh, s * .7); g.fill(); g.restore();
        D.wood(g, x0, y0, bw, bh, {r: s * .7, seed: 17, base: '#c08850', dark: '#7a4a24', vertical: l.portrait});
        g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = 2; D.rr(g, x0 + s * .08, y0 + s * .08, bw - s * .16, bh - s * .16, s * .6); g.stroke();
        // turn glow on the mover's row
        if (!st.over) {
          const r0 = st.turn === 0 ? 0 : 7, p1 = pitPos(r0, l), p2 = pitPos(r0 + 5, l);
          const minx = Math.min(p1.x, p2.x) - s * .5, miny = Math.min(p1.y, p2.y) - s * .5;
          g.fillStyle = D.alpha(ctx.color(st.turn), .16); D.rr(g, minx, miny, Math.abs(p1.x - p2.x) + s, Math.abs(p1.y - p2.y) + s, s * .45); g.fill();
        }
        if (flash.t > 0) flash.t = Math.max(0, flash.t - dt * 1.5);
        const canPick = ctx.canAct(st.turn) && !animating();
        for (let p = 0; p < 14; p++) {
          const q = pitPos(p, l);
          const rx = q.store ? (l.portrait ? s * .95 : s * .38) : s * .42, ry = q.store ? (l.portrait ? s * .38 : s * .95) : s * .42;
          const gr = g.createRadialGradient(q.x, q.y - ry * .25, s * .05, q.x, q.y, Math.max(rx, ry));
          gr.addColorStop(0, '#4a2810'); gr.addColorStop(.8, '#7a4a22'); gr.addColorStop(1, '#9a6434');
          g.fillStyle = gr; g.beginPath(); g.ellipse(q.x, q.y, rx, ry, 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(255,230,190,.25)'; g.lineWidth = 1.5; g.stroke();
          if (q.store) { g.strokeStyle = D.alpha(ctx.color(p === 6 ? 0 : 1), .7); g.lineWidth = 3; g.beginPath(); g.ellipse(q.x, q.y, rx + 3, ry + 3, 0, 0, Math.PI * 2); g.stroke(); }
          if (canPick && own(p, st.turn) && st.b[p] && (ctx.pref('hints') || p === hover)) { g.strokeStyle = p === hover ? '#ffd76a' : 'rgba(230,197,125,.6)'; g.lineWidth = p === hover ? 3.5 : 2; g.beginPath(); g.ellipse(q.x, q.y, rx + 2, ry + 2, 0, 0, Math.PI * 2); g.stroke(); }
          if (p === flash.p && flash.t > 0) { g.fillStyle = `rgba(255,120,80,${flash.t * .5})`; g.beginPath(); g.ellipse(q.x, q.y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
          vp[p].forEach((sd, k) => { const [ox, oy] = seedOff(k, q.store, l); seed(g, q.x + ox, q.y + oy, s * .085, sd); });
          if (p === handAt && hand.length) hand.forEach((sd, k) => { const [ox, oy] = seedOff(k, false, l); seed(g, q.x + ox * .7, q.y + oy * .7 - s * .55, s * .085, sd, true); });
          // count label
          const n = st.over || !animating() ? st.b[p] : vp[p].length;
          if (q.store) D.text(g, String(n), q.x, q.y, {size: s * .42, color: 'rgba(255,240,215,.92)', font: 'deco', weight: 400, shadow: 'rgba(0,0,0,.8)', blur: 6});
          else {
            const [cx, cy] = T(4, 1.5, l), off = s * .5; let lx = q.x, ly = q.y;
            if (l.portrait) lx = q.x + (q.x < cx ? -off : off); else ly = q.y + (q.y < cy ? -off : off);
            D.text(g, String(n), lx, ly, {size: s * .2, color: '#3a2010', weight: 800});
          }
        }
        // last pit played (by the other side) + hint + move preview
        const tk = performance.now() / 1000;
        if (st.last >= 0 && !animating() && !st.over) { const q = pitPos(st.last, l); g.fillStyle = D.alpha(ctx.color(st.lastBy), .9); D.circle(g, q.x + s * .3, q.y - s * .3, s * .07); g.fill(); g.strokeStyle = '#fbe9d0'; g.lineWidth = 1.5; g.stroke(); }
        if (hint >= 0 && !animating()) { const q = pitPos(hint, l); g.strokeStyle = 'rgba(90,220,160,' + (.55 + .4 * Math.sin(tk * 7)) + ')'; g.lineWidth = 5; D.circle(g, q.x, q.y, s * .5); g.stroke(); }
        const pp = preview >= 0 ? preview : hover;
        if (canPick && legalPit(pp)) {
          const v = pv(pp), col = ctx.color(st.turn);
          const src = pitPos(pp, l); g.strokeStyle = '#ffd76a'; g.lineWidth = 4; D.circle(g, src.x, src.y, s * .46); g.stroke();
          for (let p = 0; p < 14; p++) {
            if (!v.add[p] || !ctx.pref('hints')) continue;
            const q = pitPos(p, l), bx = q.x + (q.store ? 0 : s * .3), by = q.y + (q.store ? (l.portrait ? 0 : -s * .62) : s * .3);
            const bxx = q.store && l.portrait ? q.x + s * .62 : bx;
            g.fillStyle = D.alpha(col, .92); D.circle(g, bxx, by, s * .15); g.fill(); g.strokeStyle = '#fbe9d0'; g.lineWidth = 1.5; g.stroke();
            D.text(g, '+' + v.add[p], bxx, by + 1, {size: s * .15, color: '#fff', weight: 800});
          }
          if (v.land >= 0) { const q = pitPos(v.land, l), rr = q.store ? s * .5 : s * .47; g.save(); g.setLineDash([6, 5]); g.lineDashOffset = -tk * 18; g.strokeStyle = '#ffd76a'; g.lineWidth = 3.5; if (q.store) { g.beginPath(); g.ellipse(q.x, q.y, l.portrait ? s * 1.02 : s * .45, l.portrait ? s * .45 : s * 1.02, 0, 0, Math.PI * 2); } else D.circle(g, q.x, q.y, rr); g.stroke(); g.restore(); }
          if (v.capFrom >= 0) { const q = pitPos(v.capFrom, l); g.fillStyle = 'rgba(255,90,60,' + (.28 + .12 * Math.sin(tk * 8)) + ')'; D.circle(g, q.x, q.y, s * .44); g.fill(); D.text(g, '吃', q.x, q.y - s * .02, {size: s * .3, color: '#fff', font: 'serif', weight: 900, shadow: 'rgba(0,0,0,.6)'}); }
          const [cx, cy] = T(4, 1.5, l);
          if (v.extra || v.cap) D.text(g, v.extra ? '再走一次' : '吃 ' + v.cap, cx, cy, {size: s * .26, color: '#ffd76a', font: 'deco', weight: 400, stroke: '#3a2010', strokeW: 4});
        }
        if (call) {
          const [cx, cy] = T(4, 1.5, l), k = call.t;
          g.globalAlpha = Math.min(1, (1 - k) * 3); D.text(g, call.text, cx, cy - k * s * .4, {size: s * (.42 + .1 * Math.sin(Math.min(1, k * 4) * Math.PI)), color: '#ffd76a', font: 'deco', weight: 400, stroke: D.shade(ctx.color(call.seat), -30), strokeW: 6, shadow: true}); g.globalAlpha = 1;
        }
        // flying seeds
        for (const f of fly) {
          const a = pitPos(f.from, l), b = pitPos(f.to, l), k = f.k;
          const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * s * .45 - s * .1 * (1 - k);
          seed(g, x, y, s * .09, f.s, true);
        }
        // store names (on the board rim beside each store)
        for (const sd of [0, 1]) {
          const q = pitPos(STORE[sd], l), [cx, cy] = T(4, 1.5, l);
          const along = l.portrait ? [0, q.y < cy ? -1 : 1] : [q.x < cx ? -1 : 1, 0];
          void along;
          const tx = l.portrait ? q.x : q.x, ty = l.portrait ? q.y + (q.y < cy ? s * .52 : -s * .52) : q.y + s * 1.2;
          if (!l.portrait) { D.text(g, '仓', q.x, q.y - s * 1.2, {size: s * .17, color: 'rgba(255,240,215,.75)', font: 'serif'}); }
          D.text(g, ctx.name(sd), tx, ty, {size: s * .15, color: '#fbe9d0', shadow: true, maxW: l.portrait ? s * 1.8 : s * .85});
        }
      },
    };
    function callout(text, seat) { call = {text, seat, t: 0}; ctx.anim(1100, k => call && (call.t = k), () => call = null); }
    function seed(g, x, y, r, sd, lifted) {
      g.save(); g.translate(x, y); g.rotate(sd.rot);
      g.fillStyle = lifted ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(r * .15, r * (lifted ? .5 : .25), r * 1.05, r * .8, 0, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(-r * .4, -r * .35, r * .1, 0, 0, r * 1.1); gr.addColorStop(0, D.shade(sd.c, 45)); gr.addColorStop(.6, sd.c); gr.addColorStop(1, D.shade(sd.c, -35));
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 1.05, r * .8, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-r * .35, -r * .3, r * .3, r * .16, -.5, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    status();
    return inst;
  },
});
