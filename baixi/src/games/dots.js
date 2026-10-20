/* 点格棋 — dots and boxes. AI: 3rd-side avoidance, chain/loop analysis with control value (double-dealing). */
const D = BX.draw, C = BX.C;
const PC = ['#b23a2b', '#2f5d8a'], PCH = ['朱', '青'];

/* geometry helpers for an n×n box board */
function topo(n) {
  const HN = (n + 1) * n, NL = HN + n * (n + 1), NB = n * n;
  const H = (r, c) => r * n + c, V = (r, c) => HN + r * (n + 1) + c;
  const boxLines = [], lineBoxes = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) boxLines.push([H(r, c), H(r + 1, c), V(r, c), V(r, c + 1)]);
  for (let l = 0; l < NL; l++) lineBoxes.push([]);
  boxLines.forEach((ls, b) => ls.forEach(l => lineBoxes[l].push(b)));
  const seg = l => l < HN ? {r: Math.floor(l / n), c: l % n, h: true} : {r: Math.floor((l - HN) / (n + 1)), c: (l - HN) % (n + 1), h: false};
  return {n, HN, NL, NB, H, V, boxLines, lineBoxes, seg};
}
const TOPO = {};
const getTopo = n => TOPO[n] || (TOPO[n] = topo(n));

/* ---------- AI analysis on a plain lines array (0 = empty) ---------- */
const sides = (T, L, b) => { let k = 0; for (const l of T.boxLines[b]) if (L[l]) k++; return k; };
const freeLines = (T, L, b) => T.boxLines[b].filter(l => !L[l]);
function isSafe(T, L, l) { for (const b of T.lineBoxes[l]) if (sides(T, L, b) >= 2) return false; return true; }
function capturable(T, L) { const out = []; for (let b = 0; b < T.NB; b++) if (sides(T, L, b) === 3) out.push(b); return out; }
/* greedily take everything: mutates L, returns number of boxes taken */
function greedy(T, L) {
  let got = 0;
  for (;;) {
    const cb = capturable(T, L); if (!cb.length) return got;
    const l = freeLines(T, L, cb[0])[0]; L[l] = 9;
    for (const b of T.lineBoxes[l]) if (sides(T, L, b) === 4) got++;
  }
}
/* components of 2-sided boxes: chains (ends lead to boundary or junction boxes) and loops */
function components(T, L) {
  const seen = new Uint8Array(T.NB), comps = [];
  const nb = (b, l) => { const o = T.lineBoxes[l].find(x => x !== b); return o == null ? -1 : o; };
  for (let b = 0; b < T.NB; b++) {
    if (seen[b] || sides(T, L, b) !== 2) continue;
    // walk both directions
    const boxes = [b]; seen[b] = 1; let loop = false;
    const ends = [];
    for (const start of freeLines(T, L, b)) {
      let cur = b, l = start; const part = [];
      for (;;) {
        const nx = nb(cur, l);
        if (nx < 0 || sides(T, L, nx) !== 2) { ends.push(l); break; }
        if (nx === b) { loop = true; break; }
        if (seen[nx]) { loop = true; break; }
        seen[nx] = 1; part.push(nx);
        l = freeLines(T, L, nx).find(x => x !== l); cur = nx;
      }
      if (loop) { boxes.push(...part); break; }
      if (boxes.length === 1 && ends.length === 1) boxes.unshift(...part.reverse()); else boxes.push(...part);
    }
    comps.push({loop, boxes, ends, len: boxes.length});
  }
  return comps;
}
/* controller's net value when the opponent must open one component of the multiset (chains 'c', loops 'l') */
const FMEMO = new Map();
function fval(list) {
  if (!list.length) return 0;
  const key = list.slice().sort().join(',');
  if (FMEMO.has(key)) return FMEMO.get(key);
  let best = Infinity; const tried = new Set();
  for (let i = 0; i < list.length; i++) {
    if (tried.has(list[i])) continue; tried.add(list[i]);
    const rest = list.slice(0, i).concat(list.slice(i + 1)), fr = fval(rest);
    const t = list[i][0], k = +list[i].slice(1);
    let v = k - fr;                                         // take all, then must open the rest
    if (t === 'c' && k >= 3) v = Math.max(v, k - 4 + fr);   // all-but-two, keep control
    if (t === 'l') v = Math.max(v, k - 8 + fr);             // all-but-four, keep control
    if (v < best) best = v;
  }
  FMEMO.set(key, best); return best;
}
const compList = comps => comps.map(c => (c.loop ? 'l' : 'c') + c.len);

BX.register({
  id: 'dots', title: '点格棋', cat: 'party', order: 3, sub: '连线围格，围满多者胜',
  desc: '在点阵上轮流连线，谁画下一个小方格的第四条边，这一格就归谁，并且还能接着画。格子多者获胜。高级电脑懂得“让二控局”。',
  kind: 'turn', seats: 2, seatNames: ['朱方', '青方'], seatColors: PC, firstLabel: '先手', anyTimeActs: true,
  options: [{key: 'size', label: '棋盘', choices: [[4, '4×4 格'], [5, '5×5 格'], [6, '6×6 格']], def: 5}],
  rules: `<p>棋盘是一片点阵（默认 5×5 个方格，即 6×6 个点）。双方轮流在<b>相邻两点</b>之间（横或竖）画一条线。</p>
<p>谁画下了某个方格的<b>第四条边</b>，这个方格就归谁（盖上自己的印），并且<b>必须再画一条</b>；一笔同时完成两格则两格都得。没有完成方格则换对方。</p>
<p>所有线画完后，<b>占格多者获胜</b>（偶数格的棋盘可能平局）。</p>
<p>窍门：尽量不要画方格的第三条边；残局里有时故意留下最后两格送给对方（让二），可以保住先手控制权。</p>
<p>操作：电脑上直接点击两点之间；触屏上第一次点击预览，再点同一条线确认。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#f1e4c6'});
    const n = 4, s = h / 5.2, ox = (w - s * n) / 2, oy = (h - s * n) / 2;
    const fill = [[0, 0, 0], [1, 0, 0], [0, 1, 1], [2, 2, 1], [3, 3, 0]];
    for (const [c, r, p] of fill) { g.fillStyle = D.alpha(PC[p], .2); g.fillRect(ox + c * s, oy + r * s, s, s); D.text(g, PCH[p], ox + (c + .5) * s, oy + (r + .5) * s, {size: s * .55, color: PC[p], font: 'serif', weight: 900}); }
    g.lineCap = 'round'; g.lineWidth = 4;
    const ln = [[0, 0, 1, 0, 0], [1, 0, 2, 0, 0], [0, 0, 0, 1, 0], [0, 1, 0, 2, 1], [1, 0, 1, 1, 0], [2, 0, 2, 1, 0], [0, 1, 1, 1, 0], [1, 1, 2, 1, 1], [1, 1, 1, 2, 1], [0, 2, 1, 2, 1], [2, 2, 3, 2, 1], [2, 2, 2, 3, 1], [3, 2, 3, 3, 1], [2, 3, 3, 3, 0], [3, 3, 4, 3, 0], [3, 3, 3, 4, 0], [4, 3, 4, 4, 0], [3, 4, 4, 4, 0], [3, 0, 4, 0, 1], [1, 2, 1, 3, 0]];
    for (const [a, b, c2, d, p] of ln) { g.strokeStyle = PC[p]; g.beginPath(); g.moveTo(ox + a * s, oy + b * s); g.lineTo(ox + c2 * s, oy + d * s); g.stroke(); }
    for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) { g.fillStyle = C.ink; D.circle(g, ox + c * s, oy + r * s, 4); g.fill(); }
  },
  create(ctx) {
    const n = +ctx.opts.size || 5, T = getTopo(n);
    const st = {n, L: new Array(T.NL).fill(0), box: new Array(T.NB).fill(-1), turn: 0, sc: [0, 0], last: -1, moves: 0, over: false};
    const cv = ctx.canvas();
    let hover = -1, preview = -1, lineAnim = {l: -1, k: 1}; const stamp = {};
    const geo = () => { const f = BX.fit(cv.w, cv.h, n + .9, n + .9, 6); return {s: f.s, ox: f.x + f.s * .45, oy: f.y + f.s * .45}; };
    const lineAt = p => {
      const {s, ox, oy} = geo(); const x = (p.x - ox) / s, y = (p.y - oy) / s;
      let best = -1, bd = .42;
      for (let l = 0; l < T.NL; l++) {
        if (st.L[l]) continue;
        const q = T.seg(l), mx = q.h ? q.c + .5 : q.c, my = q.h ? q.r : q.r + .5;
        const dx = Math.abs(x - mx), dy = Math.abs(y - my);
        const d = q.h ? Math.max(dx - .38, 0) + dy : Math.max(dy - .38, 0) + dx;
        if (d < bd) { bd = d; best = l; }
      }
      return best;
    };
    const myTurn = () => !st.over && ctx.canAct(st.turn);
    ctx.on(cv.cv, 'pointermove', e => { if (e.pointerType === 'mouse') hover = lineAt(cv.pos(e)); });
    ctx.on(cv.cv, 'pointerleave', () => hover = -1);
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!myTurn()) return;
      const l = lineAt(cv.pos(e)); if (l < 0) { preview = -1; return; }
      if (e.pointerType !== 'mouse' && preview !== l) { preview = l; ctx.sfx('tick'); return; }
      preview = -1; hover = -1; ctx.act({l}, st.turn);
    });
    const status = () => {
      ctx.info(0, st.sc[0] + ' 格'); ctx.info(1, st.sc[1] + ' 格');
      if (st.over) return ctx.status(st.sc[0] === st.sc[1] ? '平分秋色' : '<b>' + ctx.name(st.sc[0] > st.sc[1] ? 0 : 1) + '</b> 占格更多');
      const dot = '<span style="color:' + PC[st.turn] + '">■</span> ';
      ctx.status(dot + (myTurn() ? (ctx.hotseat ? ctx.name(st.turn) + ' 画线' : '轮到你画线') : '等待 ' + ctx.name(st.turn) + '…'));
    };
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: (a, by) => by === st.turn && !st.over && Number.isInteger(a.l) && a.l >= 0 && a.l < T.NL && !st.L[a.l],
      apply(a) {
        st.L[a.l] = st.turn + 1; st.last = a.l; st.moves++; preview = -1;
        const la = {l: a.l, k: 0}; lineAnim = la; ctx.anim(160, k => la.k = k);
        let got = 0;
        for (const b of T.lineBoxes[a.l]) if (sides(T, st.L, b) === 4 && st.box[b] < 0) {
          st.box[b] = st.turn; st.sc[st.turn]++; got++;
          const sd = stamp[b] = {k: 0}; ctx.anim(320, k => sd.k = k, null, BX.ease.back);
        }
        if (got) ctx.sfx('score'); else ctx.sfx('pen');
        if (st.sc[0] + st.sc[1] === T.NB) {
          st.over = true; status();
          ctx.end({winner: st.sc[0] === st.sc[1] ? -1 : st.sc[0] > st.sc[1] ? 0 : 1, text: ctx.name(0) + ' ' + st.sc[0] + ' 格 : ' + st.sc[1] + ' 格 ' + ctx.name(1)});
          return;
        }
        if (!got) st.turn = 1 - st.turn;
        status();
      },
      aiMove(seat, level) { return {l: aiLine(st.L.slice(), level)}; },
      onTurn: status,
      frame(dt) {
        const g = cv.g; cv.clear();
        const {s, ox, oy} = geo();
        // paper sheet on wood
        D.wood(g, ox - s * .42, oy - s * .42, n * s + s * .84, n * s + s * .84, {r: s * .2, seed: 5, base: '#a8723d', dark: '#5a3418'});
        D.paper(g, ox - s * .3, oy - s * .3, n * s + s * .6, n * s + s * .6, {r: s * .12, color: '#f3e7cb'});
        // boxes
        for (let b = 0; b < T.NB; b++) {
          const o = st.box[b]; if (o < 0) continue;
          const r = Math.floor(b / n), c = b % n, sd = stamp[b], k = sd ? sd.k : 1;
          g.fillStyle = D.alpha(PC[o], .16); g.fillRect(ox + c * s, oy + r * s, s, s);
          const cx = ox + (c + .5) * s, cy = oy + (r + .5) * s, z = s * .62 * (.4 + .6 * k);
          g.save(); g.translate(cx, cy); g.rotate((b % 3 - 1) * .08);
          g.globalAlpha = Math.min(1, k * 1.4); g.fillStyle = PC[o]; D.rr(g, -z / 2, -z / 2, z, z, z * .14); g.fill();
          g.strokeStyle = 'rgba(255,240,220,.7)'; g.lineWidth = Math.max(1, z * .05); D.rr(g, -z / 2 + z * .1, -z / 2 + z * .1, z * .8, z * .8, z * .08); g.stroke();
          D.text(g, PCH[o], 0, z * .03, {size: z * .62, color: '#fff3e0', font: 'serif', weight: 900});
          g.restore(); g.globalAlpha = 1;
        }
        // 3-sided warning glow (for the side to move: capturable boxes)
        if (!st.over) for (let b = 0; b < T.NB; b++) if (st.box[b] < 0 && sides(T, st.L, b) === 3) {
          const r = Math.floor(b / n), c = b % n; g.fillStyle = 'rgba(230,180,60,.18)'; g.fillRect(ox + c * s + 2, oy + r * s + 2, s - 4, s - 4);
        }
        // lines
        g.lineCap = 'round';
        const end = (q) => q.h ? [ox + q.c * s, oy + q.r * s, ox + (q.c + 1) * s, oy + q.r * s] : [ox + q.c * s, oy + q.r * s, ox + q.c * s, oy + (q.r + 1) * s];
        const gh = preview >= 0 ? preview : hover;
        if (gh >= 0 && !st.L[gh] && myTurn()) {
          const [x1, y1, x2, y2] = end(T.seg(gh)); g.strokeStyle = D.alpha(PC[st.turn], preview >= 0 ? .7 : .4); g.lineWidth = s * .1;
          g.setLineDash([s * .1, s * .12]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
        }
        for (let l = 0; l < T.NL; l++) {
          const p = st.L[l]; if (!p) continue;
          let [x1, y1, x2, y2] = end(T.seg(l));
          if (lineAnim.l === l && lineAnim.k < 1) { x2 = BX.lerp(x1, x2, lineAnim.k); y2 = BX.lerp(y1, y2, lineAnim.k); }
          g.strokeStyle = PC[p - 1]; g.lineWidth = Math.max(3, s * .085);
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
          if (l === st.last) { g.strokeStyle = 'rgba(255,236,170,.75)'; g.lineWidth = Math.max(1.5, s * .03); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
        }
        // dots
        for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) {
          g.fillStyle = '#1e1610'; D.circle(g, ox + c * s, oy + r * s, Math.max(3.5, s * .075)); g.fill();
          g.fillStyle = 'rgba(255,255,255,.25)'; D.circle(g, ox + c * s - s * .02, oy + r * s - s * .02, Math.max(1, s * .025)); g.fill();
        }
      },
    };
    status();
    return inst;

    /* ---------------- AI ---------------- */
    function aiLine(L, level) {
      const free = []; for (let l = 0; l < T.NL; l++) if (!L[l]) free.push(l);
      const cap = capturable(T, L);
      const safe = free.filter(l => isSafe(T, L, l));
      const rnd = a => a[Math.floor(Math.random() * a.length)];
      const capLine = b => freeLines(T, L, b)[0];
      if (level === 1) {
        if (cap.length && Math.random() < .8) return capLine(rnd(cap));
        if (safe.length && Math.random() < .75) return rnd(safe);
        return rnd(free);
      }
      if (cap.length) {
        if (level >= 3) { const dd = doubleDeal(L, cap, safe.length); if (dd >= 0) return dd; }
        // prefer a line that completes two boxes, then boxes not leading into a chain
        let best = capLine(cap[0]), bs = -1;
        for (const b of cap) { const l = capLine(b); let v = 0; for (const o of T.lineBoxes[l]) { const k = sides(T, L, o); if (o !== b && k === 3) v += 2; if (o !== b && k === 2) v -= 0; } if (v > bs) { bs = v; best = l; } }
        return best;
      }
      if (safe.length) {
        if (level >= 3 && safe.length <= (BX.test ? 6 : 14)) { const m = safeSearch(L, safe); if (m >= 0) return m; }
        return rnd(safe);
      }
      // must sacrifice
      if (level === 2) {
        let best = [], bv = Infinity;
        for (const l of free) { const L2 = L.slice(); L2[l] = 9; const v = greedy(T, L2); if (v < bv) { bv = v; best = [l]; } else if (v === bv) best.push(l); }
        return rnd(best);
      }
      return sacrifice(L, free);
    }
    function openLine(L, comp) {
      if (comp.loop) return freeLines(T, L, comp.boxes[0])[0];
      if (comp.len === 2) { const [a, b] = comp.boxes; const sh = T.boxLines[a].find(l => !L[l] && T.boxLines[b].includes(l)); if (sh != null) return sh; }
      return comp.ends.length ? comp.ends[0] : freeLines(T, L, comp.boxes[0])[0];
    }
    function sacrifice(L, free) {
      const comps = components(T, L), list = compList(comps);
      if (!comps.length) return free[Math.floor(Math.random() * free.length)];
      let best = null, bv = Infinity;
      comps.forEach((c, i) => {
        const rest = list.slice(0, i).concat(list.slice(i + 1)), fr = fval(rest);
        let v = c.len - fr;
        if (!c.loop && c.len >= 3) v = Math.max(v, c.len - 4 + fr);
        if (c.loop) v = Math.max(v, c.len - 8 + fr);
        if (v < bv || (v === bv && c.len < best.len)) { bv = v; best = c; }
      });
      const l = openLine(L, best);
      return l != null && !L[l] ? l : free[0];
    }
    /* during a capture run: decide whether to decline the last 2 (chain) / 4 (loop) boxes to keep control */
    function doubleDeal(L, cap, nSafe) {
      // what remains after taking everything?
      const L2 = L.slice(); greedy(T, L2);
      const rest = []; for (let l = 0; l < T.NL; l++) if (!L2[l]) rest.push(l);
      if (!rest.length) return -1;
      if (rest.some(l => isSafe(T, L2, l))) return -1;           // still safe moves afterwards: just take
      const fr = fval(compList(components(T, L2)));
      const nbr = (b, l) => { const o = T.lineBoxes[l].find(x => x !== b); return o == null ? -1 : o; };
      if (cap.length === 1) {
        const A = cap[0], la = freeLines(T, L, A)[0], B = nbr(A, la);
        if (B < 0 || sides(T, L, B) !== 2) return -1;
        const X = freeLines(T, L, B).find(l => l !== la), C2 = nbr(B, X);
        if (C2 >= 0 && sides(T, L, C2) >= 2) return -1;          // chain is longer than 2 (or would feed another box)
        return fr > 2 ? X : -1;                                  // give 2, opponent must open: -2 + fr  vs  take 2: 2 - fr
      }
      if (cap.length === 2) {
        const [A, Dd] = cap, la = freeLines(T, L, A)[0], ld = freeLines(T, L, Dd)[0];
        if (la === ld) return -1;
        const B = nbr(A, la), C2 = nbr(Dd, ld);
        if (B < 0 || C2 < 0 || B === C2 || sides(T, L, B) !== 2 || sides(T, L, C2) !== 2) return -1;
        const m = freeLines(T, L, B).find(l => l !== la);
        if (m == null || !T.boxLines[C2].includes(m)) return -1;
        return fr > 4 ? m : -1;
      }
      return -1;
    }
    /* small minimax over the remaining safe moves; leaf = whoever must open first */
    function safeSearch(L0, safe0) {
      const L = L0.slice(), t0 = performance.now(), lim = BX.test ? 30 : 450; let abort = false, nodes = 0;
      const memo = new Map();
      function rec(depth) {
        if ((++nodes & 255) === 0 && performance.now() - t0 > lim) abort = true;
        if (abort) return 0;
        const safe = []; for (let l = 0; l < T.NL; l++) if (!L[l] && isSafe(T, L, l)) safe.push(l);
        if (!safe.length) return -fval(compList(components(T, L)));
        if (depth === 0) return (safe.length % 2 ? 1 : -1);
        const key = L.join('');
        if (memo.has(key)) return memo.get(key);
        let best = -Infinity;
        for (const l of safe) { L[l] = 9; const v = -rec(depth - 1); L[l] = 0; if (abort) return 0; if (v > best) best = v; }
        memo.set(key, best); return best;
      }
      let choice = -1;
      for (let d = 2; d <= 16; d += 2) {
        let bv = -Infinity, bl = [];
        for (const l of safe0) { L[l] = 9; const v = -rec(d - 1); L[l] = 0; if (abort) break; if (v > bv) { bv = v; bl = [l]; } else if (v === bv) bl.push(l); }
        if (abort) break;
        memo.clear(); choice = bl[Math.floor(Math.random() * bl.length)];
        if (performance.now() - t0 > lim * .4) break;
      }
      return choice;
    }
  },
});
