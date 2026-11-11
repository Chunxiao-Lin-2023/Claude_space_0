/* 黑白棋 — 标准 8×8 规则 + negamax（位置权重+行动力，高级残局精确求解） */
const D = BX.draw, C = BX.C, L = BX.data.cls;
const DIRS = [-9, -8, -7, -1, 1, 7, 8, 9];
const W8 = [
  120, -20, 20, 5, 5, 20, -20, 120,
  -20, -40, -5, -5, -5, -5, -40, -20,
  20, -5, 15, 3, 3, 15, -5, 20,
  5, -5, 3, 3, 3, 3, -5, 5,
  5, -5, 3, 3, 3, 3, -5, 5,
  20, -5, 15, 3, 3, 15, -5, 20,
  -20, -40, -5, -5, -5, -5, -40, -20,
  120, -20, 20, 5, 5, 20, -20, 120];
const CORNER_OF = {9: 0, 14: 7, 49: 56, 54: 63, 1: 0, 8: 0, 6: 7, 15: 7, 48: 56, 57: 56, 55: 63, 62: 63};
const step = (s, d) => { const c = s & 7, n = s + d; if (n < 0 || n > 63) return -1; if (d === -9 || d === -1 || d === 7) { if (c === 0) return -1; } if (d === -7 || d === 1 || d === 9) { if (c === 7) return -1; } return n; };
const NB = []; for (let s = 0; s < 64; s++) NB[s] = DIRS.map(d => { const r = []; let t = s; for (;;) { t = step(t, d); if (t < 0) break; r.push(t); } return r; });
/* b: Int8Array, 1 = black, 2 = white */
function flips(b, s, me) {
  if (b[s]) return null; const op = 3 - me; let out = null;
  for (const ray of NB[s]) {
    let i = 0; while (i < ray.length && b[ray[i]] === op) i++;
    if (i > 0 && i < ray.length && b[ray[i]] === me) { out = out || []; for (let k = 0; k < i; k++) out.push(ray[k]); }
  }
  return out;
}
function canMove(b, s, me) {
  if (b[s]) return false; const op = 3 - me;
  for (const ray of NB[s]) { let i = 0; while (i < ray.length && b[ray[i]] === op) i++; if (i > 0 && i < ray.length && b[ray[i]] === me) return true; }
  return false;
}
const movesOf = (b, me) => { const o = []; for (let s = 0; s < 64; s++) if (canMove(b, s, me)) o.push(s); return o; };
const count = b => { let x = 0, y = 0; for (let s = 0; s < 64; s++) { if (b[s] === 1) x++; else if (b[s] === 2) y++; } return [x, y]; };
function evalPos(b, me, lv) {
  const op = 3 - me; let v = 0, mc = 0, oc = 0, empt = 0;
  for (let s = 0; s < 64; s++) {
    const p = b[s]; if (!p) { empt++; continue; }
    let w = W8[s]; const cn = CORNER_OF[s]; if (cn != null && b[cn]) w = b[cn] === p ? 10 : 0;
    if (p === me) { v += w; mc++; } else { v -= w; oc++; }
  }
  if (lv >= 2) {
    const m1 = movesOf(b, me).length, m2 = movesOf(b, op).length;
    v += (m1 - m2) * (lv >= 3 ? 14 : 8);
    if (lv >= 3) { // frontier discs
      let fr = 0; for (let s = 0; s < 64; s++) { const p = b[s]; if (!p) continue; let f = false; for (const ray of NB[s]) if (ray.length && !b[ray[0]]) { f = true; break; } if (f) fr += p === me ? -1 : 1; } v += fr * 5;
    }
  }
  if (empt < 14) v += (mc - oc) * (14 - empt) * 2;
  return v;
}
/* exact endgame solver (disc difference for `me`) */
function solve(b, me, alpha, beta, passed, deadline, ctr) {
  if ((++ctr.n & 2047) === 0 && performance.now() > deadline) { ctr.stop = true; return 0; }
  const ms = movesOf(b, me);
  if (!ms.length) {
    if (passed) { const [x, y] = count(b); return (me === 1 ? x - y : y - x) * 1000; }
    return -solve(b, 3 - me, -beta, -alpha, true, deadline, ctr);
  }
  if (ms.length > 1) ms.sort((a, c) => W8[c] - W8[a]);
  let best = -Infinity;
  for (const s of ms) {
    const f = flips(b, s, me); b[s] = me; for (const t of f) b[t] = me;
    const v = -solve(b, 3 - me, -beta, -alpha, false, deadline, ctr);
    b[s] = 0; for (const t of f) b[t] = 3 - me;
    if (ctr.stop) return 0;
    if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
  }
  return best;
}
function think(b0, me, level) {
  const b = Int8Array.from(b0), ms = movesOf(b, me);
  if (ms.length <= 1) return ms[0];
  const empt = b.reduce((a, x) => a + (x ? 0 : 1), 0), t0 = performance.now();
  const budget = BX.test ? 30 : level >= 3 ? 580 : level === 2 ? 250 : 60;
  if (level >= 3 && empt <= (BX.test ? 8 : 13)) {
    const ctr = {n: 0, stop: false}, dl = t0 + budget; let best = ms[0], bv = -Infinity, alpha = -Infinity;
    const ord = ms.slice().sort((a, c) => W8[c] - W8[a]);
    for (const s of ord) {
      const f = flips(b, s, me); b[s] = me; for (const t of f) b[t] = me;
      const v = -solve(b, 3 - me, -Infinity, -alpha, false, dl, ctr);
      b[s] = 0; for (const t of f) b[t] = 3 - me;
      if (ctr.stop) break;
      if (v > bv) { bv = v; best = s; } if (v > alpha) alpha = v;
    }
    if (!ctr.stop) return best;
  }
  if (level === 1) {
    const scored = ms.map(s => { const f = flips(b, s, me); b[s] = me; for (const t of f) b[t] = me; const v = -evalPos(b, 3 - me, 1) + f.length * 4; b[s] = 0; for (const t of f) b[t] = 3 - me; return [s, v + (Math.random() - .5) * 60]; });
    return BX.ai.byLevel(scored, 2);
  }
  const lv = level;
  const st = {b, me, stack: []};
  const r = BX.ai.negamax({
    state: st, depth: level >= 3 ? 12 : level === 2 ? 4 : 1, timeMs: budget,
    moves: s => { const m = movesOf(s.b, s.me); return m.length ? m : (movesOf(s.b, 3 - s.me).length ? [-1] : []); },
    play(s, m) { if (m < 0) { s.me = 3 - s.me; return null; } const f = flips(s.b, m, s.me); s.b[m] = s.me; for (const t of f) s.b[t] = s.me; s.me = 3 - s.me; return [m, f]; },
    unplay(s, tk) { s.me = 3 - s.me; if (!tk) return; s.b[tk[0]] = 0; for (const t of tk[1]) s.b[t] = 3 - s.me; },
    evaluate: s => { if (!movesOf(s.b, s.me).length && !movesOf(s.b, 3 - s.me).length) { const [x, y] = count(s.b); const d = s.me === 1 ? x - y : y - x; return d * 1000; } return evalPos(s.b, s.me, lv); },
    order: (s, m) => m.slice().sort((a, c) => (W8[c] || 0) - (W8[a] || 0)),
  });
  return r.move != null && r.move >= 0 ? r.move : ms[0];
}

BX.register({
  id: 'reversi', title: '黑白棋', cat: 'classic', order: 4, sub: '夹住就翻面',
  desc: '在 8×8 棋盘上落子夹住对方棋子并翻转成己方颜色，终局子多者胜。角与边的争夺决定胜负，高级电脑残局会精确计算。',
  kind: 'turn', seats: 2, seatNames: ['黑方', '白方'], seatColors: ['#1c1a18', '#ece8df'], firstLabel: '执子',
  howto: ['棋盘上的<b>小圆点</b>是你可以落子的位置。电脑上鼠标移过去会显示落子虚影；触屏默认<b>先点一下预览</b>，再点同一处确认（可在「⋯」里改为点一下直接落子）。开启辅助模式后，预览还会标出将被翻转的棋子并显示能翻几子。',
    '红点标出上一手，没有地方可下时会自动停一手。',
    '下方 ◀ ▶ 回看每一步，「谱」查看全部落子；电脑键盘 ← → 回看。',
    '顶栏 ↶ 悔棋，💡 提示推荐落点。'],
  rules: `<p><b>开局</b>：8×8 棋盘，中央四格交叉摆放黑白各两子，<b>黑方先行</b>。</p>
<p><b>落子</b>：每步必须落在空格上，并且至少在一个方向（横、竖、斜）上与己方另一枚棋子<b>夹住</b>一枚或连续多枚对方棋子，被夹住的棋子全部翻转为己方颜色。可以同时在多个方向上翻转。</p>
<p><b>停手</b>：若一方没有任何合法落点，只能停一手（自动跳过），由对方继续落子；有合法落点时不能放弃。</p>
<p><b>终局</b>：双方都无法落子（包括棋盘下满）时游戏结束，棋子多的一方获胜，数量相同为和棋。</p>
<p><b>小提示</b>：四个角永远不会被翻转，非常宝贵；紧挨角的格子（特别是斜对角的「星位」）往往会把角送给对方。</p>
<p>棋盘上的小点为当前可落子的位置；开启辅助模式后，预览时被翻转的棋子会出现金色标记，并显示能翻几子。</p>`,
  icon(g, w, h) {
    D.felt(g, 0, 0, w, h, {color: '#2e6b4c'});
    const s = h / 4.4, x0 = w / 2 - 3 * s, y0 = h / 2 - 2 * s;
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(x0 + i * s, y0 - s * .2); g.lineTo(x0 + i * s, y0 + 4 * s + s * .2); g.stroke(); }
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(x0 - s * .2, y0 + i * s); g.lineTo(x0 + 6 * s + s * .2, y0 + i * s); g.stroke(); }
    const pts = [[2, 1, 1], [3, 1, 0], [2, 2, 0], [3, 2, 1], [4, 2, 1], [1, 2, 1], [4, 1, 0]];
    for (const [c, r, wt] of pts) D.stone(g, x0 + (c + .5) * s, y0 + (r + .5) * s, s * .42, !!wt);
    // a flipping disc
    g.save(); g.translate(x0 + 5.5 * s, y0 + 2.5 * s); g.scale(.35, 1); D.stone(g, 0, 0, s * .42, true); g.restore();
  },
  create(ctx) {
    const b0 = new Array(64).fill(0); b0[27] = 2; b0[36] = 2; b0[28] = 1; b0[35] = 1;
    const st = {b: b0, turn: 0, last: -1, over: false, passes: 0, flipped: [], moves: 0, result: null};
    const cv = ctx.canvas(), boardImg = L.cache();
    let flipT = 1, dropT = 1, passMsg = null, legal = [], preview = -1, hover = -1, hint = null, endCall = null;
    const H = L.history(ctx); H.push({b: st.b.slice(), last: -1, txt: '开局', side: -1});
    const me = () => st.turn + 1;
    const coord = i => 'abcdefgh'[i & 7] + ((i >> 3) + 1);
    function geo() {
      const W = cv.w, H0 = cv.h, land = W > H0 * 1.08, Hs = land ? H0 : H0 - 50;
      const f = land ? BX.fit(W, Hs, 8.9 + 2 * 3.2, 8.9, 6) : BX.fit(W, Hs, 8.9, 8.9 + 2 * 1.3, 6);
      const s = Math.min(f.s, 84), ox = Math.round(W / 2 - 4 * s), oy = Math.round(Hs / 2 - 4 * s), m = .45 * s;
      let pl;
      if (land) { const pw = Math.min(s * 3, (W - 8.9 * s) / 2 - 14), ph = Math.min(s * 2.4, 150); pl = [{x: ox - m - 10 - pw, y: oy + s * .2, w: pw, h: ph, v: true}, {x: ox + 8 * s + m + 10, y: oy + 7.8 * s - ph, w: pw, h: ph, v: true}]; }
      else { const ph = Math.min(s * 1.05, 56), pw = 8 * s + 2 * m; pl = [{x: ox - m, y: oy - m - 8 - ph, w: pw, h: ph}, {x: ox - m, y: oy + 8 * s + m + 8, w: pw, h: ph}]; }
      return {s, ox, oy, pl, m, land};
    }
    const cellAt = p => { const G = geo(), c = Math.floor((p.x - G.ox) / G.s), r = Math.floor((p.y - G.oy) / G.s); return r < 0 || r > 7 || c < 0 || c > 7 ? -1 : r * 8 + c; };
    const refresh = () => { legal = st.over ? [] : movesOf(Int8Array.from(st.b), me()); };
    function status() {
      const [x, y] = count(st.b); ctx.info(0, x); ctx.info(1, y);
      if (st.over) return ctx.status(st.result);
      const nm = ctx.name(st.turn);
      ctx.status(ctx.canAct(st.turn) ? (ctx.hotseat ? nm + '落子' : '轮到你落子') + (ctx.assist ? '（可落 ' + legal.length + ' 处）' : '') : '等待 ' + nm + ' 落子…');
    }
    const canPlay = () => ctx.canAct(st.turn) && !st.over && H.live();
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') { const s = cellAt(cv.pos(e)); hover = canPlay() && legal.includes(s) ? s : -1; } });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!H.live()) { H.go(1e9); return; }
      if (!canPlay()) return;
      const s = cellAt(cv.pos(e));
      if (s < 0) { preview = -1; return; }
      if (!legal.includes(s)) { preview = -1; ctx.sfx('error'); ctx.buzz(12); return; }
      if (ctx.needConfirm(e) && preview !== s) { preview = s; ctx.sfx('tick'); return; }
      preview = -1; ctx.act({i: s}, st.turn);
    });
    const tb = L.toolbar(ctx, {label: true, buttons: [
      {id: 'p', text: '◀', title: '上一步', on: () => H.prev()},
      {id: 'n', text: '▶', title: '下一步', on: () => H.next()},
      {id: 'l', text: '谱', title: '棋谱', on: () => H.showList('棋谱', x => x.txt)},
    ]});
    function endCheck() {
      const B = Int8Array.from(st.b);
      if (movesOf(B, me()).length) return;
      if (movesOf(B, 3 - me()).length) {   // pass
        const who = ctx.name(st.turn); st.turn ^= 1; st.passes++;
        passMsg = {t: who + ' 无处可下，停一手', k: 0}; ctx.anim(1800, k => { if (passMsg) passMsg.k = k; }, () => passMsg = null, x => x);
        ctx.sfx('buzz'); return;
      }
      const [x, y] = count(st.b); st.over = true;
      const w = x > y ? 0 : y > x ? 1 : -1;
      st.result = w < 0 ? `${x} : ${y} 和棋` : `${ctx.name(w)} 以 ${Math.max(x, y)} : ${Math.min(x, y)} 获胜`;
      endCall = {t: `黑 ${x} : ${y} 白`, k: 0}; ctx.anim(2600, k => { if (endCall) endCall.k = k; }, () => endCall = null, x2 => x2);
      if (w >= 0 && ctx.isLocal(w) && ctx.mode !== 'local') ctx.buzz(40);
      ctx.end({winner: w, text: `黑 ${x} : ${y} 白` + (w < 0 ? '，和棋' : '')});
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => a && Number.isInteger(a.i) && canMove(Int8Array.from(st.b), a.i, me()),
      apply(a) {
        const f = flips(Int8Array.from(st.b), a.i, me()), side = st.turn;
        st.b[a.i] = me(); for (const t of f) st.b[t] = me();
        st.last = a.i; st.flipped = f; st.moves++;
        st.turn ^= 1;
        preview = -1; hover = -1; hint = null;
        H.push({b: st.b.slice(), last: a.i, side, txt: (side ? '白 ' : '黑 ') + coord(a.i) + '<small style="opacity:.6"> 翻' + f.length + '</small>'});
        dropT = 0; flipT = 0;
        ctx.anim(140, k => dropT = k, null, BX.ease.out);
        ctx.after(90, () => { ctx.anim(380, k => flipT = k); ctx.sfx('flip'); });
        ctx.sfx('stone');
        endCheck(); refresh(); status();
      },
      aiMove(seat, level) {
        const m = think(st.b, seat + 1, level);
        return {i: m != null ? m : movesOf(Int8Array.from(st.b), seat + 1)[0]};
      },
      onTurn: status,
      showHint(a) { H.go(1e9); preview = -1; hint = {i: a.i, t0: performance.now()}; },
      _xy: i => { const G = geo(); return [G.ox + ((i & 7) + .5) * G.s, G.oy + ((i >> 3) + .5) * G.s]; },
      key(e) { if (e.code === 'ArrowLeft') H.prev(); else if (e.code === 'ArrowRight') H.next(); else if (e.code === 'Escape') preview = -1; },
      frame() {
        const g = cv.g; cv.clear(); const G = geo(), s = G.s;
        const live = H.live(), view = H.cur(), B = live ? st.b : view.b, last = live ? st.last : view.last;
        g.drawImage(boardImg(g, cv.w + 'x' + cv.h, cv.w, cv.h, c => {
          const m = G.m;
          c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = s * .5; c.shadowOffsetY = s * .12; c.fillStyle = '#3a2210'; D.rr(c, G.ox - m, G.oy - m, 8 * s + 2 * m, 8 * s + 2 * m, s * .2); c.fill(); c.restore();
          D.wood(c, G.ox - m, G.oy - m, 8 * s + 2 * m, 8 * s + 2 * m, {r: s * .2, base: '#7a4a24', dark: '#2a1408', seed: 4, grain: .3});
          D.felt(c, G.ox, G.oy, 8 * s, 8 * s, {color: '#2f6f4f'});
          c.strokeStyle = 'rgba(10,30,20,.65)'; c.lineWidth = Math.max(1, s * .03);
          c.beginPath(); for (let i = 0; i <= 8; i++) { c.moveTo(G.ox + i * s, G.oy); c.lineTo(G.ox + i * s, G.oy + 8 * s); c.moveTo(G.ox, G.oy + i * s); c.lineTo(G.ox + 8 * s, G.oy + i * s); } c.stroke();
          c.fillStyle = 'rgba(10,30,20,.8)'; for (const [x, y] of [[2, 2], [6, 2], [2, 6], [6, 6]]) { D.circle(c, G.ox + x * s, G.oy + y * s, s * .07); c.fill(); }
          const fs = Math.max(9, m * .58);
          for (let i = 0; i < 8; i++) {
            D.text(c, 'abcdefgh'[i], G.ox + (i + .5) * s, G.oy - m * .5, {size: fs, color: 'rgba(240,215,170,.8)', font: 'serif'});
            D.text(c, String(i + 1), G.ox - m * .5, G.oy + (i + .5) * s, {size: fs, color: 'rgba(240,215,170,.8)', font: 'serif'});
          }
        }), 0, 0, cv.w, cv.h);
        const [nb, nw] = count(B);
        for (const seat of [0, 1]) {
          const pr = G.pl[seat];
          L.plate(g, pr.x, pr.y, pr.w, pr.h, {active: !st.over && st.turn === seat, color: seat ? '#ece8df' : '#1c1a18', title: ctx.name(seat), tag: (seat ? '白' : '黑') + ' ' + (seat ? nw : nb) + ' 子', vertical: pr.v});
        }
        // disc-share bar inside the bottom plate area edge
        { const pr = G.pl[1], bw = pr.v ? pr.w - 16 : pr.w - 16, bx = pr.x + 8, by = pr.v ? pr.y + pr.h - 14 : pr.y + pr.h - 7, k = nb / Math.max(1, nb + nw);
          g.fillStyle = '#ece8df'; D.rr(g, bx, by, bw, 4, 2); g.fill(); g.fillStyle = '#1c1a18'; D.rr(g, bx, by, Math.max(2, bw * k), 4, 2); g.fill(); }
        const slot = L.tbSlot(G, cv.w, cv.h, G.pl[1], G.pl[0]); tb.place(slot.x, slot.y, slot.w, slot.col);
        const n = H.list.length - 1, i0 = H.idx();
        tb.label(!live ? `<b>回看 ${i0}/${n}</b> · ${i0 ? view.txt : '开局'}` : n ? `第 ${n} 手 · ${view.txt}` : '黑方先下');
        tb.set('p', {disabled: i0 <= 0}); tb.set('n', {disabled: live});
        const R0 = s * .42, fl = new Set(live ? st.flipped : []);
        const pv = live ? (preview >= 0 ? preview : hover) : -1, pvf = pv >= 0 ? new Set(ctx.assist ? flips(Int8Array.from(st.b), pv, me()) || [] : []) : null;
        for (let i = 0; i < 64; i++) {
          const p = B[i]; if (!p) continue;
          const x = G.ox + ((i & 7) + .5) * s, y = G.oy + ((i >> 3) + .5) * s;
          if (live && i === st.last && dropT < 1) { D.stone(g, x, y - (1 - dropT) * s * .2, R0 * (1.15 - .15 * dropT), p === 2); continue; }
          if (fl.has(i) && flipT < 1) {
            const k = flipT, sx = Math.abs(Math.cos(k * Math.PI)) || .02, white = k < .5 ? p !== 2 : p === 2;
            g.save(); g.translate(x, y - Math.sin(k * Math.PI) * s * .12); g.scale(Math.max(.04, sx), 1); D.stone(g, 0, 0, R0, white); g.restore();
            continue;
          }
          D.stone(g, x, y, R0, p === 2);
          if (pvf && pvf.has(i)) { g.strokeStyle = 'rgba(255,205,90,.95)'; g.lineWidth = Math.max(2, s * .06); D.circle(g, x, y, R0 * .55); g.stroke(); }
        }
        if (last >= 0) { const x = G.ox + ((last & 7) + .5) * s, y = G.oy + ((last >> 3) + .5) * s; g.fillStyle = C.red2; D.circle(g, x, y, s * .08); g.fill(); }
        if (live && !st.over && ctx.canAct(st.turn) && ctx.pref('hints')) {
          for (const i of legal) { if (i === pv) continue; const x = G.ox + ((i & 7) + .5) * s, y = G.oy + ((i >> 3) + .5) * s; g.globalAlpha = .35; D.stone(g, x, y, R0 * .32, st.turn === 1); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,230,160,.55)'; g.lineWidth = 1.5; D.circle(g, x, y, R0 * .34); g.stroke(); }
        }
        if (pv >= 0 && pvf) {
          const x = G.ox + ((pv & 7) + .5) * s, y = G.oy + ((pv >> 3) + .5) * s;
          g.globalAlpha = preview >= 0 ? .8 : .55; D.stone(g, x, y, R0, st.turn === 1); g.globalAlpha = 1;
          if (ctx.assist) D.text(g, '+' + pvf.size, x, y + 1, {size: s * .3, color: st.turn === 1 ? '#3a2410' : '#ffe9b0', weight: 800});
        }
        if (live && hint && !anim0()) { const x = G.ox + ((hint.i & 7) + .5) * s, y = G.oy + ((hint.i >> 3) + .5) * s; L.hintArrow(g, null, null, x, y, R0, hint.t0); }
        if (passMsg) L.callout(g, G.ox + 4 * s, G.oy + 4 * s, Math.min(s * .5, 26), passMsg.t, passMsg.k, '#3a5a4a');
        if (endCall) L.callout(g, G.ox + 4 * s, G.oy + 4 * s, Math.min(s * .7, 34), endCall.t, endCall.k);
      },
    };
    const anim0 = () => flipT < 1;
    refresh(); status();
    return inst;
  },
});
