/* 经典棋类共享工具（xiangqi / chess / reversi / jungle 使用）：alpha-beta 搜索引擎、Zobrist、绘制小件 */
BX.data.cls = (function () {
  const MATE = 1000000;
  /* deterministic zobrist tables (integer-only, identical on every engine) */
  function zob(n, seed) {
    const r = BX.rng(seed), a = new Int32Array(n), b = new Int32Array(n);
    for (let i = 0; i < n; i++) { a[i] = (r() * 4294967296) | 0; b[i] = (r() * 4294967296) | 0; }
    return {a, b};
  }
  const key = (h1, h2) => (h1 >>> 0) * 2097152 + ((h2 >>> 0) & 0x1fffff);

  /* Negamax alpha-beta + quiescence + TT + killers/history + iterative deepening.
     P: {moves(capOnly) → int[], make(m) → legal?, unmake(), evaluate() (side to move), hash(), score(m) (>0 for captures),
         over(ply) → score|null, noMove(ply) → score, inCheck?()}
     o: {timeMs, depth, qs (default true), qmax, past: Set of keys (game history → repetition = draw), exclude: Set, all: bool} */
  function search(P, o) {
    const t0 = performance.now(), limit = o.timeMs || 400, maxD = o.depth || 64, useQ = o.qs !== false, qmax = o.qmax || 24;
    const TT = new Map(), killers = [], hist = new Map(), onPath = new Map(), past = o.past || null;
    let nodes = 0, stop = false;
    const tick = () => { if ((++nodes & 1023) === 0 && performance.now() - t0 > limit) stop = true; return stop; };
    function order(ms, ply, ttm) {
      const sc = new Array(ms.length), k1 = killers[ply * 2], k2 = killers[ply * 2 + 1];
      for (let i = 0; i < ms.length; i++) {
        const m = ms[i];
        sc[i] = m === ttm ? 2e9 : (P.score(m) || (m === k1 ? 9e5 : m === k2 ? 8.9e5 : (hist.get(m) || 0)));
      }
      return sc;
    }
    function pick(ms, sc, i) {
      let bi = i; for (let j = i + 1; j < ms.length; j++) if (sc[j] > sc[bi]) bi = j;
      if (bi !== i) { const t = ms[i]; ms[i] = ms[bi]; ms[bi] = t; const u = sc[i]; sc[i] = sc[bi]; sc[bi] = u; }
      return ms[i];
    }
    function qs(alpha, beta, ply, qd) {
      if (tick()) return 0;
      const tv = P.over(ply); if (tv != null) return tv;
      const stand = P.evaluate();
      if (!useQ || qd >= qmax) return stand;
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      const ms = P.moves(true), sc = ms.map(m => P.score(m));
      for (let i = 0; i < ms.length; i++) {
        const m = pick(ms, sc, i);
        if (!P.make(m)) continue;
        const v = -qs(-beta, -alpha, ply + 1, qd + 1); P.unmake();
        if (stop) return 0;
        if (v >= beta) return v;
        if (v > alpha) alpha = v;
      }
      return alpha;
    }
    function ab(d, alpha, beta, ply) {
      if (tick()) return 0;
      const k = P.hash();
      if (ply > 0) {
        const tv = P.over(ply); if (tv != null) return tv;
        if ((onPath.get(k) | 0) > 0 || (past && past.has(k))) return 0;
        if (P.drawish && P.drawish()) return 0;
      }
      if (P.inCheck && ply < 40 && P.inCheck()) d++;
      if (d <= 0) return qs(alpha, beta, ply, 0);
      const e = TT.get(k); let ttm = -1;
      if (e) {
        ttm = e.m;
        if (e.d >= d) { if (e.f === 0) return e.v; if (e.f === 1 && e.v >= beta) return e.v; if (e.f === 2 && e.v <= alpha) return e.v; }
      }
      const ms = P.moves(false), sc = order(ms, ply, ttm);
      onPath.set(k, (onPath.get(k) | 0) + 1);
      let best = -Infinity, bm = -1, legal = 0; const a0 = alpha;
      for (let i = 0; i < ms.length; i++) {
        const m = pick(ms, sc, i);
        if (!P.make(m)) continue;
        legal++;
        const v = -ab(d - 1, -beta, -alpha, ply + 1); P.unmake();
        if (stop) break;
        if (v > best) {
          best = v; bm = m;
          if (v > alpha) {
            alpha = v;
            if (alpha >= beta) {
              if (!P.score(m)) { if (killers[ply * 2] !== m) { killers[ply * 2 + 1] = killers[ply * 2]; killers[ply * 2] = m; } hist.set(m, Math.min(8e5, (hist.get(m) || 0) + d * d)); }
              break;
            }
          }
        }
      }
      const c = onPath.get(k) - 1; if (c > 0) onPath.set(k, c); else onPath.delete(k);
      if (stop) return 0;
      if (!legal) best = P.noMove(ply);
      if (TT.size > 300000) TT.clear();
      TT.set(k, {d, v: best, f: best <= a0 ? 2 : best >= beta ? 1 : 0, m: bm});
      return best;
    }
    // ---- root ----
    let rootMs = P.moves(false).filter(m => { if (!P.make(m)) return false; P.unmake(); return true; });
    if (o.exclude) { const f = rootMs.filter(m => !o.exclude.has(m)); if (f.length) rootMs = f; }
    if (!rootMs.length) return {move: null, score: 0, depth: 0, list: []};
    const rootKey = P.hash();
    if (o.all) {   // full-window score of every root move at fixed depth (used for weak levels)
      const list = [];
      onPath.set(rootKey, 1);
      for (const m of rootMs) { P.make(m); const v = -ab((o.depth || 1) - 1, -Infinity, Infinity, 1); P.unmake(); if (stop) break; list.push([m, v]); }
      onPath.delete(rootKey);
      if (!list.length) list.push([rootMs[0], 0]);
      return {list, move: list.slice().sort((a, b) => b[1] - a[1])[0][0]};
    }
    if (rootMs.length === 1) return {move: rootMs[0], score: 0, depth: 0};
    { const sc = order(rootMs, 0, -1); const idx = rootMs.map((m, i) => i).sort((a, b) => sc[b] - sc[a]); rootMs = idx.map(i => rootMs[i]); }
    let best = rootMs[0], bestV = 0, reached = 0;
    for (let d = 1; d <= maxD; d++) {
      let alpha = -Infinity, ib = null, iv = -Infinity; const vals = [];
      onPath.set(rootKey, 1);
      for (const m of rootMs) {
        P.make(m); const v = -ab(d - 1, -Infinity, -alpha, 1); P.unmake();
        if (stop) break;
        vals.push([m, v]);
        if (v > iv) { iv = v; ib = m; }
        if (v > alpha) alpha = v;
      }
      onPath.delete(rootKey);
      if (ib != null) { best = ib; bestV = iv; reached = d; }
      if (stop) break;
      rootMs = [ib, ...vals.filter(x => x[0] !== ib).sort((a, b) => b[1] - a[1]).map(x => x[0])];
      if (Math.abs(iv) > MATE - 1000) break;
      if (performance.now() - t0 > limit * .5) break;
    }
    return {move: best, score: bestV, depth: reached, nodes};
  }
  /* choose from full-window scored list with noise (weak levels) */
  function noisy(list, noise, blunder) {
    if (Math.random() < blunder && list.length > 2) {
      const s = list.slice().sort((a, b) => b[1] - a[1]); return s[Math.floor(Math.random() * Math.min(s.length, 6))][0];
    }
    let bm = list[0][0], bv = -Infinity;
    for (const [m, v] of list) { const nv = v + (Math.random() * 2 - 1) * noise; if (nv > bv) { bv = nv; bm = m; } }
    return bm;
  }

  /* ---------- drawing helpers ---------- */
  const D = BX.draw;
  /* seal-stamp callout ("将军"): k = 0..1 animation progress */
  function callout(g, x, y, size, text, k, color) {
    if (k == null || k >= 1) return;
    const a = k < .14 ? k / .14 : k > .72 ? (1 - k) / .28 : 1, sc = k < .14 ? 1.9 - .9 * BX.ease.out(k / .14) : 1;
    const w = size * (text.length * 1.08 + .7), h = size * 1.55;
    g.save(); g.globalAlpha = Math.max(0, a); g.translate(x, y); g.scale(sc, sc); g.rotate(-.07);
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = size * .4; g.shadowOffsetY = size * .1;
    g.fillStyle = color || '#b23a2b'; D.rr(g, -w / 2, -h / 2, w, h, size * .22); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,240,215,.85)'; g.lineWidth = size * .07; D.rr(g, -w / 2 + size * .14, -h / 2 + size * .14, w - size * .28, h - size * .28, size * .14); g.stroke();
    D.text(g, text, 0, size * .04, {size, color: '#fff3e0', font: 'deco', weight: 400});
    g.restore();
  }
  /* player plate: name + turn glow + list of small items (captured pieces etc.) */
  function plate(g, x, y, w, h, o) {
    g.save();
    if (o.active) { g.shadowColor = 'rgba(240,200,110,.75)'; g.shadowBlur = 16; }
    g.fillStyle = o.active ? 'rgba(60,36,16,.86)' : 'rgba(30,18,8,.58)'; D.rr(g, x, y, w, h, Math.min(14, h * .3)); g.fill();
    g.shadowColor = 'transparent';
    g.lineWidth = o.active ? 2 : 1; g.strokeStyle = o.active ? '#e6c57d' : 'rgba(230,197,125,.28)'; g.stroke();
    const fs = Math.max(11, Math.min(17, o.vertical ? w * .11 : h * .3));
    const ty = o.vertical ? y + fs * 1.1 : y + h / 2;
    const dotR = fs * .38;
    g.fillStyle = o.color; D.circle(g, x + fs * .9, ty, dotR); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.stroke();
    D.text(g, o.title, x + fs * 1.6, ty, {size: fs, color: '#f3e2c0', align: 'left', weight: 700, maxW: o.vertical ? w - fs * 2.2 : w * .42});
    let tw = 0; g.font = `700 ${fs}px ${BX.F.sans}`; tw = Math.min(g.measureText(o.title).width, o.vertical ? w : w * .42);
    if (o.tag) D.text(g, o.tag, o.vertical ? x + w / 2 : x + fs * 2.1 + tw, o.vertical ? ty + fs * 1.35 : ty, {size: fs * .78, color: o.active ? '#ffd98a' : 'rgba(243,226,192,.6)', align: o.vertical ? 'center' : 'left', weight: 600});
    // items
    const items = o.items || [];
    if (items.length && o.drawItem) {
      let ax, ay, aw, ah;
      if (o.vertical) { ax = x + 6; ay = ty + fs * (o.tag ? 2.1 : 1); aw = w - 12; ah = y + h - 6 - ay; }
      else { ax = x + fs * 2.6 + tw + (o.tag ? fs * 4 : 0); ay = y + 3; aw = x + w - 6 - ax; ah = h - 6; }
      if (aw > 10 && ah > 10) {
        let r = Math.min(o.itemR || 99, ah / 2, o.vertical ? aw / 6 : 99);
        let cols, rows;
        for (;;) { cols = Math.max(1, Math.floor(aw / (r * 2.05))); rows = Math.max(1, Math.floor(ah / (r * 2.05))); if (cols * rows >= items.length || r < 5) break; r *= .9; }
        const ov = cols * rows < items.length ? (aw - 2 * r) / Math.max(1, items.length - 1) : r * 2.05;
        items.forEach((it, i) => {
          const cc = cols * rows >= items.length ? i % cols : i, rr = cols * rows >= items.length ? Math.floor(i / cols) : 0;
          o.drawItem(g, ax + r + cc * (cols * rows >= items.length ? r * 2.05 : ov), ay + r + rr * r * 2.05 + (o.vertical ? 0 : (ah - Math.min(rows, Math.ceil(items.length / cols)) * r * 2.05) / 2), r, it);
        });
      }
    }
    g.restore();
  }
  /* offscreen cache for static boards */
  function cache() {
    let cv = null, sig = '';
    return function (g, s, w, h, draw) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!cv || sig !== s + '|' + dpr) {
        sig = s + '|' + dpr; cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
        const c = cv.getContext('2d'); c.scale(dpr, dpr); draw(c);
      }
      return cv;
    };
  }
  const levelTime = lv => BX.test ? 25 : lv >= 3 ? 720 : lv === 2 ? 260 : 80;
  return {MATE, zob, key, search, noisy, callout, plate, cache, levelTime};
})();
