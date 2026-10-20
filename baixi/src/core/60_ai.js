/* ===================== AI helpers ===================== */
BX.ai = (function () {
  const A = {};
  /* Negamax alpha-beta with iterative deepening.
     o = {state, depth (max), timeMs, moves(s) → array, play(s,m) → child state (or in-place token if unplay given),
          unplay?(s, token), evaluate(s) → score for the side to move in s (bigger = better for them),
          terminal?(s) → score for side to move if game over else null, order?(s, moves) → sorted moves}
     returns {move, score, depth} */
  A.negamax = function (o) {
    const t0 = performance.now(), limit = o.timeMs || 400, maxD = o.depth || 4;
    let best = null, bestScore = -Infinity, reached = 0, aborted = false, nodes = 0;
    const inPlace = !!o.unplay;
    function search(s, d, alpha, beta) {
      if ((++nodes & 1023) === 0 && performance.now() - t0 > limit) { aborted = true; return 0; }
      if (o.terminal) { const tv = o.terminal(s); if (tv != null) return tv - (maxD - d) * 0; }
      if (d === 0) return o.evaluate(s);
      let ms = o.moves(s); if (!ms.length) return o.evaluate(s);
      if (o.order) ms = o.order(s, ms);
      let v = -Infinity;
      for (const m of ms) {
        let sc;
        if (inPlace) { const tk = o.play(s, m); sc = -search(s, d - 1, -beta, -alpha); o.unplay(s, tk); }
        else sc = -search(o.play(s, m), d - 1, -beta, -alpha);
        if (aborted) return 0;
        if (sc > v) v = sc; if (v > alpha) alpha = v; if (alpha >= beta) break;
      }
      return v;
    }
    let rootMoves = o.moves(o.state); if (!rootMoves.length) return {move: null, score: 0, depth: 0};
    if (o.order) rootMoves = o.order(o.state, rootMoves);
    for (let d = 1; d <= maxD; d++) {
      let lb = null, ls = -Infinity, alpha = -Infinity;
      const scored = [];
      for (const m of rootMoves) {
        let sc;
        if (inPlace) { const tk = o.play(o.state, m); sc = -search(o.state, d - 1, -Infinity, -alpha); o.unplay(o.state, tk); }
        else sc = -search(o.play(o.state, m), d - 1, -Infinity, -alpha);
        if (aborted) break;
        scored.push([m, sc]);
        if (sc > ls) { ls = sc; lb = m; } if (sc > alpha) alpha = sc;
      }
      if (aborted && d > 1) break;
      if (lb != null) { best = lb; bestScore = ls; reached = d; }
      // principal move first next iteration
      if (scored.length === rootMoves.length) rootMoves = scored.sort((a, b) => b[1] - a[1]).map(x => x[0]);
      if (aborted || performance.now() - t0 > limit * .5) break;
    }
    return {move: best != null ? best : rootMoves[0], score: bestScore, depth: reached};
  };

  /* Monte-Carlo tree search (UCT) for n-player games.
     o = {state, seat (who is choosing), timeMs | iters, clone(s), moves(s), play(s,m) (mutates), toMove(s) → seat,
          result(s) → null if not over, else array payoff per seat (0..1), rollout?(s) policy move picker,
          determinize?(s, seat) → clone with hidden info resampled, maxRollout?} → best move */
  A.mcts = function (o) {
    const t0 = performance.now(), limit = o.timeMs || 500, maxIt = o.iters || 1e9, C = o.c || 1.2;
    const rootMoves = o.moves(o.state); if (rootMoves.length <= 1) return rootMoves[0];
    const key = m => typeof m === 'object' ? JSON.stringify(m) : String(m);
    const root = {n: 0, w: 0, kids: new Map(), untried: null, seat: -1};
    let it = 0;
    while (it < maxIt && (it < 30 || performance.now() - t0 < limit)) {
      it++;
      let s = o.determinize ? o.determinize(o.state, o.seat) : o.clone(o.state);
      let node = root; const path = [root];
      // selection / expansion
      for (;;) {
        if (o.result(s)) break;
        const ms = o.moves(s); if (!ms.length) break;
        const mover = o.toMove(s);
        const fresh = ms.filter(m => !node.kids.has(key(m)));
        if (fresh.length) {
          const m = fresh[Math.floor(Math.random() * fresh.length)];
          const child = {n: 0, w: 0, kids: new Map(), seat: mover, m};
          node.kids.set(key(m), child); o.play(s, m); node = child; path.push(node); break;
        }
        let bestC = null, bv = -Infinity; const ln = Math.log(node.n + 1);
        for (const m of ms) { const c = node.kids.get(key(m)); const v = c.w / (c.n + 1e-9) + C * Math.sqrt(ln / (c.n + 1e-9)); if (v > bv) { bv = v; bestC = c; } }
        o.play(s, bestC.m); node = bestC; path.push(node);
      }
      // rollout
      let steps = 0, r;
      while (!(r = o.result(s)) && steps++ < (o.maxRollout || 400)) {
        const ms = o.moves(s); if (!ms.length) break;
        o.play(s, o.rollout ? o.rollout(s, ms) : ms[Math.floor(Math.random() * ms.length)]);
      }
      if (!r) r = o.heuristic ? o.heuristic(s) : null;
      // backprop
      for (const nd of path) { nd.n++; if (r && nd.seat >= 0) nd.w += r[nd.seat] || 0; }
    }
    let best = null, bn = -1;
    for (const c of root.kids.values()) if (c.n > bn) { bn = c.n; best = c.m; }
    return best != null ? best : rootMoves[0];
  };

  /* choose among scored moves by difficulty. scored = [[move, score], ...]; level 1..3 */
  A.byLevel = function (scored, level, rnd = Math.random) {
    if (!scored.length) return null;
    const arr = scored.slice().sort((a, b) => b[1] - a[1]);
    if (level >= 3) { const top = arr.filter(x => x[1] >= arr[0][1] - 1e-9); return top[Math.floor(rnd() * top.length)][0]; }
    if (level === 2) { if (rnd() < .75) return arr[0][0]; const k = Math.min(arr.length, 3); return arr[Math.floor(rnd() * k)][0]; }
    if (rnd() < .35) return arr[Math.floor(rnd() * arr.length)][0];
    const k = Math.min(arr.length, 5); return arr[Math.floor(rnd() * k)][0];
  };
  /* time-sliced async helper so long searches don't freeze the frame: await BX.ai.yield() */
  A.yield = () => new Promise(r => setTimeout(r, 0));
  return A;
})();
