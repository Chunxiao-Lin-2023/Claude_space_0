/* 五子棋 — reference implementation of a TURN game (read this before writing a new turn game). */
const N = 15, D = BX.draw, C = BX.C, L = BX.data.cls;
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const COLS = 'ABCDEFGHIJKLMNO';
const coord = i => COLS[i % N] + (N - Math.floor(i / N));

/* ---------- pure rules (shared by apply + AI) ---------- */
function fiveLine(b, x, y) {
  const c = b[idx(x, y)];
  for (const [dx, dy] of DIRS) {
    const line = [[x, y]];
    for (let k = 1; inb(x + dx * k, y + dy * k) && b[idx(x + dx * k, y + dy * k)] === c; k++) line.push([x + dx * k, y + dy * k]);
    for (let k = 1; inb(x - dx * k, y - dy * k) && b[idx(x - dx * k, y - dy * k)] === c; k++) line.unshift([x - dx * k, y - dy * k]);
    if (line.length >= 5) return line;
  }
  return null;
}
/* 禁手 (renju, black only): placing black at i makes 三三 / 四四 / 长连 without making an exact five.
   Line-pattern check (non-recursive, as in most apps): returns '' | '三三' | '四四' | '长连' */
function forbidden(b, i) {
  if (b[i]) return '';
  const x0 = i % N, y0 = Math.floor(i / N), Lr = new Array(11);
  let fours = 0, threes = 0, over = false;
  const run = (A, c) => { let a = c, z = c; while (a > 0 && A[a - 1] === 1) a--; while (z < 10 && A[z + 1] === 1) z++; return [a, z]; };
  for (const [dx, dy] of DIRS) {
    for (let k = -5; k <= 5; k++) { const x = x0 + dx * k, y = y0 + dy * k; Lr[k + 5] = !inb(x, y) ? 3 : k === 0 ? 1 : b[idx(x, y)] === 1 ? 1 : b[idx(x, y)] ? 3 : 0; }
    const [a0, z0] = run(Lr, 5), len = z0 - a0 + 1;
    if (len === 5) return '';            // exact five wins outright
    if (len > 5) { over = true; continue; }
    let four = 0;
    for (let j = 1; j <= 9; j++) { if (Lr[j] !== 0) continue; Lr[j] = 1; const [a, z] = run(Lr, 5); if (z - a + 1 === 5) four++; Lr[j] = 0; }
    if (four) { fours += four >= 2 && len < 4 ? 2 : 1; continue; }   // X_XXX_X style = two fours on one line
    for (let j = 1; j <= 9; j++) {
      if (Lr[j] !== 0) continue; Lr[j] = 1; const [a, z] = run(Lr, 5);
      if (z - a + 1 === 4 && a >= 1 && z <= 9 && Lr[a - 1] === 0 && Lr[z + 1] === 0 && (a < 2 || Lr[a - 2] !== 1) && (z > 8 || Lr[z + 2] !== 1)) { Lr[j] = 0; threes++; break; }
      Lr[j] = 0;
    }
  }
  return fours >= 2 ? '四四' : threes >= 2 ? '三三' : over ? '长连' : '';
}
/* pattern score of placing color c at (x,y): counts runs + open ends in 4 directions */
function pointScore(b, x, y, c) {
  let total = 0;
  for (const [dx, dy] of DIRS) {
    let cnt = 1, open = 0, gap = 0;
    for (const s of [1, -1]) {
      let k = 1;
      while (inb(x + dx * k * s, y + dy * k * s) && b[idx(x + dx * k * s, y + dy * k * s)] === c) { cnt++; k++; }
      const nx = x + dx * k * s, ny = y + dy * k * s;
      if (inb(nx, ny) && b[idx(nx, ny)] === 0) {
        open++;
        // one-gap extension (e.g. XX_X)
        let k2 = k + 1; while (inb(x + dx * k2 * s, y + dy * k2 * s) && b[idx(x + dx * k2 * s, y + dy * k2 * s)] === c) { gap++; k2++; }
      }
    }
    const eff = cnt + Math.min(gap, 4 - Math.min(cnt, 4));
    if (cnt >= 5) total += 1e7;
    else if (cnt === 4) total += open === 2 ? 1e6 : open === 1 ? 1.2e5 : 0;
    else if (eff >= 4 && open >= 1) total += 1e5;                     // broken four
    else if (cnt === 3) total += open === 2 ? 5e4 : open === 1 ? 1500 : 0;
    else if (eff === 3 && open === 2) total += 2.5e4;                  // broken three
    else if (cnt === 2) total += open === 2 ? 1200 : open === 1 ? 150 : 0;
    else total += open === 2 ? 40 : open === 1 ? 10 : 0;
  }
  return total;
}
function candidates(b) {
  const out = []; let any = false;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (b[idx(x, y)]) { any = true; continue; }
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (inb(xx, yy) && b[idx(xx, yy)]) { near = true; break; } }
    if (near) out.push([x, y]);
  }
  if (!any) out.push([7, 7]);
  return out;
}

BX.register({
  id: 'gomoku', title: '五子棋', cat: 'classic', order: 3, sub: '先连成五子者胜',
  desc: '黑白双方轮流落子，横、竖、斜任意方向先连成五子即胜。可选黑方禁手规则；电脑三档难度，高级会主动做杀。',
  kind: 'turn', seats: 2, seatNames: ['黑方', '白方'], seatColors: ['#1c1a18', '#ece8df'], firstLabel: '执子',
  options: [{key: 'rule', label: '规则', choices: [['free', '无禁手'], ['renju', '黑方禁手']], def: 'free'}],
  howto: ['点击交叉点落子；触屏默认先点一下预览（出现十字准线）、再点同一处确认（可在「⋯」菜单里改成点一下直接落子）。',
    '红点标出上一手，连成五子时会画出连线。选「黑方禁手」规则时，黑方的禁手点会打上红叉，不能落子。',
    '下方 ◀ ▶ 回看每一手，「序」显示/隐藏手数；电脑键盘 ← → 回看。',
    '↶ 悔棋会退回到你的上一步；💡 提示会标出电脑推荐的落点。'],
  rules: `<p>标准 15 路棋盘，<b>黑先白后</b>，轮流在交叉点上落子，落下后不能移动。</p>
<p>任何一方先在横、竖或斜方向上连成<b>五个或更多</b>同色棋子即获胜；棋盘下满仍无人连五则为和棋。</p>
<p>默认为<b>无禁手</b>规则（自由五子棋）。开局时可选<b>黑方禁手</b>：黑方不能下出<b>三三</b>（一子同时形成两个活三）、<b>四四</b>（同时形成两个四）或<b>长连</b>（六子及以上），但若同时连成恰好五子则算获胜；白方没有限制，白方长连也算赢。禁手点会标红叉并禁止落子。</p>
<p>触屏上第一次点击预览落点，再点同一位置确认。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {seed: 3});
    const s = h / 6; g.strokeStyle = 'rgba(60,35,10,.6)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * s + s / 2, 0); g.lineTo(i * s + s / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s + s / 2); g.lineTo(w, i * s + s / 2); g.stroke(); }
    const pts = [[2, 1, 1], [3, 2, 1], [4, 3, 1], [5, 4, 1], [2, 3, 0], [3, 3, 0], [4, 1, 0], [5, 2, 0]];
    for (const [x, y, b] of pts) D.stone(g, x * s + s / 2, y * s + s / 2, s * .44, !b);
  },
  create(ctx) {
    /* ALL game state lives in `st` and is changed ONLY inside apply(). It must be JSON-serializable. */
    const st = {b: new Array(N * N).fill(0), turn: 0, last: -1, win: null, moves: 0, over: false};
    const renju = ctx.opts.rule === 'renju';
    const cv = ctx.canvas();
    let hover = -1, preview = -1, drop = {i: -1, t: 1}, hint = -1, hintT = 0, forb = new Map(), showNum = !!ctx.load('nums', false);
    const order = new Int16Array(N * N);                 // UI-side move numbers (rebuilt by replay)
    const H = L.history(ctx); H.push({b: st.b.slice(), last: -1, txt: '开局', side: -1});
    const geo = () => {
      const W = cv.w, H0 = cv.h, land = W > H0 * 1.15, Hs = land ? H0 : H0 - 50;
      const f = BX.fit(W, Hs, N + 1, N + 1, 6);
      return {cell: f.s, ox: f.x + f.s, oy: f.y + f.s, land, bx: f.x, bw: f.s * (N + 1)};
    };
    const cellAt = p => { const {cell, ox, oy} = geo(); const x = Math.round((p.x - ox) / cell), y = Math.round((p.y - oy) / cell); return inb(x, y) ? idx(x, y) : -1; };
    const myTurn = () => ctx.canAct(st.turn) && !st.over && H.live();
    const refresh = () => { forb = new Map(); if (renju && !st.over && st.turn === 0) for (let i = 0; i < N * N; i++) { const f = forbidden(st.b, i); if (f) forb.set(i, f); } };
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = cellAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!H.live()) { H.go(1e9); return; }
      if (!myTurn()) return;
      const i = cellAt(cv.pos(e)); if (i < 0 || st.b[i]) { preview = -1; return; }
      if (forb.has(i)) { preview = -1; ctx.sfx('error'); ctx.buzz(20); ctx.toast('禁手（' + forb.get(i) + '），黑方不能下这里'); return; }
      if (ctx.needConfirm(e) && preview !== i) { preview = i; ctx.sfx('tick'); return; }   // tap to preview, tap again to place
      preview = -1; ctx.act({i}, st.turn);
    });
    const tb = L.toolbar(ctx, {label: true, buttons: [
      {id: 'p', text: '◀', title: '上一手', on: () => H.prev()},
      {id: 'n', text: '▶', title: '下一手', on: () => H.next()},
      {id: 'o', text: '序', title: '显示手数', on: () => { showNum = !showNum; ctx.save('nums', showNum); ctx.sfx('tick'); }},
    ]});
    const status = () => {
      ctx.info(0, '黑'); ctx.info(1, '白');
      if (st.over) return ctx.status(st.win ? ctx.name(st.win.seat) + ' 连成五子' : '和棋');
      ctx.status(ctx.canAct(st.turn) ? (ctx.hotseat ? ctx.name(st.turn) + '落子' : '轮到你落子') : '等待 ' + ctx.name(st.turn) + ' 落子…');
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => Number.isInteger(a.i) && a.i >= 0 && a.i < N * N && !st.b[a.i] && !(renju && st.turn === 0 && forbidden(st.b, a.i)),
      apply(a, by) {
        const side = st.turn;
        st.b[a.i] = st.turn + 1; st.last = a.i; st.moves++; preview = -1; hint = -1;
        order[a.i] = st.moves;
        H.push({b: st.b.slice(), last: a.i, side, txt: (side ? '白 ' : '黑 ') + coord(a.i)});
        drop = {i: a.i, t: 0}; ctx.anim(160, k => drop.t = k);
        ctx.sfx('stone');
        const line = fiveLine(st.b, a.i % N, Math.floor(a.i / N));
        if (line) {
          st.win = {seat: st.turn, line: line.map(([x, y]) => idx(x, y))}; st.over = true; status();
          if (ctx.isLocal(st.turn) && ctx.mode !== 'local') ctx.buzz(40);
          ctx.end({winner: st.turn, text: ctx.name(st.turn) + ' 第 ' + st.moves + ' 手连成五子'}); return;
        }
        if (st.moves === N * N) { st.over = true; status(); ctx.end({winner: -1}); return; }
        st.turn = 1 - st.turn; refresh(); status();
      },
      aiMove(seat, level) {
        const me = seat + 1, op = 2 - seat, b = st.b, ban = renju && seat === 0;
        let cand = candidates(b);
        if (ban) { const ok = cand.filter(([x, y]) => !forbidden(b, idx(x, y))); if (ok.length) cand = ok; }
        const scored = cand.map(([x, y]) => {
          const att = pointScore(b, x, y, me), def = pointScore(b, x, y, op);
          let s = att * (level === 1 ? 1 : 1.1) + def * (level === 1 ? .6 : .95);
          if (level === 1) s *= .6 + Math.random() * .8;
          return [idx(x, y), s];
        });
        if (level >= 3) {   // look one ply deeper on the best few: avoid giving the opponent a winning double threat
          scored.sort((a, b2) => b2[1] - a[1]);
          const top = scored.slice(0, 8);
          for (const t of top) {
            if (t[1] >= 1e6) continue;
            b[t[0]] = me; let worst = 0;
            for (const [x, y] of candidates(b)) { if (renju && op === 1 && forbidden(b, idx(x, y))) continue; const v = pointScore(b, x, y, op); if (v > worst) worst = v; }
            b[t[0]] = 0; t[1] -= worst * .5;
          }
          return {i: BX.ai.byLevel(top, 3)};
        }
        return {i: BX.ai.byLevel(scored, level)};
      },
      onTurn: status,
      showHint(a) { H.go(1e9); hint = a.i; hintT = performance.now(); },
      _xy: i => { const {cell, ox, oy} = geo(); return [ox + (i % N) * cell, oy + Math.floor(i / N) * cell]; },
      key(e) { if (e.code === 'ArrowLeft') H.prev(); else if (e.code === 'ArrowRight') H.next(); else if (e.code === 'Escape') preview = -1; },
      frame() {
        const g = cv.g; cv.clear();
        const G = geo(), {cell, ox, oy} = G, R = cell * .46;
        const live = H.live(), view = H.cur(), B = live ? st.b : view.b, last = live ? st.last : view.last;
        D.wood(g, ox - cell * .8, oy - cell * .8, cell * (N - 1 + 1.6), cell * (N - 1 + 1.6), {r: cell * .3, seed: 11, base: '#d6a565'});
        g.strokeStyle = 'rgba(50,30,10,.75)'; g.lineWidth = 1;
        g.beginPath(); for (let i = 0; i < N; i++) { g.moveTo(ox + i * cell, oy); g.lineTo(ox + i * cell, oy + (N - 1) * cell); g.moveTo(ox, oy + i * cell); g.lineTo(ox + (N - 1) * cell, oy + i * cell); } g.stroke();
        g.lineWidth = 2; g.strokeRect(ox, oy, (N - 1) * cell, (N - 1) * cell);
        for (const [x, y] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) { g.fillStyle = 'rgba(50,30,10,.85)'; D.circle(g, ox + x * cell, oy + y * cell, cell * .1); g.fill(); }
        // coordinates (A–O / 15–1)
        const fs = Math.max(8, cell * .34), lc = 'rgba(70,40,14,.62)';
        for (let i = 0; i < N; i++) {
          D.text(g, COLS[i], ox + i * cell, oy + (N - 1) * cell + cell * .56, {size: fs, color: lc, weight: 700});
          D.text(g, String(N - i), ox - cell * .56, oy + i * cell, {size: fs, color: lc, weight: 700});
        }
        const ghost = live ? (preview >= 0 ? preview : hover) : -1;
        if (preview >= 0 && myTurn() && !st.b[preview]) {   // crosshair helps aiming on small phone boards
          const px = ox + (preview % N) * cell, py = oy + Math.floor(preview / N) * cell;
          g.strokeStyle = 'rgba(200,50,30,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ox, py); g.lineTo(ox + (N - 1) * cell, py); g.moveTo(px, oy); g.lineTo(px, oy + (N - 1) * cell); g.stroke();
        }
        const upto = live ? 1e9 : H.idx();
        for (let i = 0; i < N * N; i++) {
          if (!B[i]) continue;
          const x = ox + (i % N) * cell, y = oy + Math.floor(i / N) * cell;
          const s = live && i === drop.i ? .6 + .4 * drop.t : 1;
          D.stone(g, x, y, R * s, B[i] === 2);
          if (showNum && order[i] && order[i] <= upto) D.text(g, String(order[i]), x, y + 1, {size: cell * (order[i] > 99 ? .32 : .4), color: B[i] === 2 ? '#2a1a0a' : '#f3e6cc', weight: 700});
        }
        if (last >= 0 && !showNum) { const x = ox + (last % N) * cell, y = oy + Math.floor(last / N) * cell; g.fillStyle = C.red; D.circle(g, x, y, cell * .1); g.fill(); }
        if (last >= 0 && showNum) { const x = ox + (last % N) * cell, y = oy + Math.floor(last / N) * cell; g.strokeStyle = C.red; g.lineWidth = 2; D.circle(g, x, y, R * 1.04); g.stroke(); }
        if (st.win && live) { g.strokeStyle = C.red; g.lineWidth = cell * .12; g.lineCap = 'round'; const Ln = st.win.line; const p = i => [ox + (i % N) * cell, oy + Math.floor(i / N) * cell]; g.beginPath(); g.moveTo(...p(Ln[0])); g.lineTo(...p(Ln[Ln.length - 1])); g.stroke(); }
        if (live && forb.size && myTurn() && ctx.pref('hints')) {
          g.strokeStyle = 'rgba(200,40,30,.8)'; g.lineWidth = Math.max(1.5, cell * .08); const d = cell * .2;
          g.beginPath(); for (const i of forb.keys()) { const x = ox + (i % N) * cell, y = oy + Math.floor(i / N) * cell; g.moveTo(x - d, y - d); g.lineTo(x + d, y + d); g.moveTo(x + d, y - d); g.lineTo(x - d, y + d); } g.stroke();
        }
        if (live && hint >= 0 && !st.b[hint]) { const k = (performance.now() - hintT) / 1000; g.strokeStyle = 'rgba(63,160,120,' + (.55 + .35 * Math.sin(k * 6)) + ')'; g.lineWidth = cell * .1; D.circle(g, ox + (hint % N) * cell, oy + Math.floor(hint / N) * cell, R * (1.05 + .08 * Math.sin(k * 6))); g.stroke(); }
        if (ghost >= 0 && !st.b[ghost] && myTurn() && !forb.has(ghost)) { g.globalAlpha = preview >= 0 ? .75 : .45; D.stone(g, ox + (ghost % N) * cell, oy + Math.floor(ghost / N) * cell, R, st.turn === 1); g.globalAlpha = 1; }
        // toolbar: under the board (portrait) or right of it (landscape)
        if (G.land) { const x = G.bx + G.bw + 10, w = Math.min(196, cv.w - x - 8); if (w >= 140) tb.place(x, cv.h - 104, w, true); else tb.place(cv.w - 158, cv.h - 104, 150, true); }
        else tb.place(G.bx + 4, Math.min(oy + (N - 1) * cell + cell * 1.1, cv.h - 46), G.bw - 8, false);
        const n = H.list.length - 1, i0 = H.idx();
        tb.label(!live ? `<b>回看 ${i0}/${n}</b> · ${i0 ? view.txt : '开局'}` : n ? `第 ${n} 手 · ${view.txt}` : renju ? '黑先 · 黑方禁手' : '黑方先下');
        tb.set('p', {disabled: i0 <= 0}); tb.set('n', {disabled: live}); tb.set('o', {on: showNum});
      },
    };
    refresh();
    return inst;
  },
});
