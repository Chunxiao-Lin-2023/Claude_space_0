/* 华容道 — 4×5 滑块。经典布局 + 最少步数，拖动/滑动/轻点移动，BFS 提示下一步最优走法，每个布局记录最佳步数。 */
const D = BX.draw, K = BX.data.slkit;
/* C=曹操 2×2；A,B,D,E,F = 五虎将（形状自动识别：竖 1×2 / 横 2×1）；s=兵；.=空。最少步数（同一块连续移动算一步）由求解器验证。 */
const LAYS = [
  ['横刀立马', 'ACCB ACCB DEEF DssF s..s'],
  ['指挥若定', 'ACCB ACCB sEEs DssF D..F'],
  ['将拥曹营', 'sCCs ACCB ADDB EssF E..F'],
  ['齐头并进', 'ACCB ACCB ssss DEEF D..F'],
  ['兵分三路', 'sCCs ACCB AEEB DssF D..F'],
  ['雨声淅沥', 'sCCs ACCB ADDB EFF. E..s'],
  ['左右布兵', 'sCCs sCCs ABDE ABDE .FF.'],
  ['桃花园中', 'sCCs ACCB AEEB D..F DssF'],
  ['水泄不通', 'ACCs ACCs BBDD EEFF .s.s'],
  ['四面楚歌', 'ACCB ACCB sDEs sDEs .FF.'],
  ['兵临城下', 'ACCB ACCB DssE DssE .FF.'],
  ['插翅难飞', 'ACCB ACCB DEEs DFFs ..ss'],
  ['围而不歼', 'ACCs ACCs BDDE BFFE s..s'],
  ['勇闯五关', 'sCCs ACCB AEEB DFFs D..s'],
  ['近在咫尺', 'AsBs ACCB .CC. DEEF DssF'],
];
const GEN = ['关羽', '张飞', '赵云', '马超', '黄忠'];
function parse(str) {
  const g = str.replace(/\s/g, ''), pcs = [], seen = new Set();
  for (let i = 0; i < 20; i++) {
    const c = g[i]; if (c === '.' || seen.has(i)) continue;
    const x = i % 4, y = (i / 4) | 0;
    if (c === 's') { pcs.push({x, y, w: 1, h: 1, t: 's'}); seen.add(i); continue; }
    let w = 1, h = 1; if (x < 3 && g[i + 1] === c) w = 2; if (y < 4 && g[i + 4] === c) h = 2;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) seen.add(i + dy * 4 + dx);
    pcs.push({x, y, w, h, t: c === 'C' ? 'C' : 'g'});
  }
  // names: first horizontal general = 关羽, others in order
  const gens = pcs.filter(p => p.t === 'g'), names = GEN.slice();
  const hz = gens.find(p => p.w === 2); if (hz) { hz.n = '关羽'; names.shift(); } else names.shift();
  for (const p of gens) if (!p.n) p.n = names.shift() || '将';
  for (const p of pcs) { if (p.t === 'C') p.n = '曹操'; if (p.t === 's') p.n = '兵'; }
  return pcs;
}
const kindOf = p => p.w === 2 && p.h === 2 ? 4 : p.w === 2 ? 3 : p.h === 2 ? 2 : 1;
function keyOf(pos, pcs) { const g = new Array(20).fill(0); pcs.forEach((p, i) => { const k = kindOf(p), x = pos[i * 2], y = pos[i * 2 + 1]; for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) g[(y + dy) * 4 + x + dx] = k; }); return g.join(''); }
/* moves of piece i: all cells reachable by sliding (1 step) */
function reach(pos, pcs, i) {
  const occ = new Array(20).fill(-1);
  pcs.forEach((p, j) => { for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) occ[(pos[j * 2 + 1] + dy) * 4 + pos[j * 2] + dx] = j; });
  const p = pcs[i], x0 = pos[i * 2], y0 = pos[i * 2 + 1], vis = new Set([x0 * 8 + y0]), q = [[x0, y0]], out = [];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ddx, ny = y + ddy; if (nx < 0 || ny < 0 || nx + p.w > 4 || ny + p.h > 5 || vis.has(nx * 8 + ny)) continue;
      let ok = true; for (let dy = 0; dy < p.h && ok; dy++) for (let dx = 0; dx < p.w; dx++) { const o = occ[(ny + dy) * 4 + nx + dx]; if (o !== -1 && o !== i) { ok = false; break; } }
      if (!ok) continue; vis.add(nx * 8 + ny); q.push([nx, ny]); out.push([nx, ny]);
    }
  }
  return out;
}
/* BFS → shortest path (array of [piece, x, y]) */
function solve(pos0, pcs) {
  const ci = pcs.findIndex(p => p.t === 'C');
  const k0 = keyOf(pos0, pcs), prev = new Map([[k0, null]]);
  let fr = [pos0];
  const done = pos => pos[ci * 2] === 1 && pos[ci * 2 + 1] === 3;
  if (done(pos0)) return [];
  while (fr.length) {
    const nf = [];
    for (const pos of fr) {
      const kp = keyOf(pos, pcs);
      for (let i = 0; i < pcs.length; i++) for (const [x, y] of reach(pos, pcs, i)) {
        const np = pos.slice(); np[i * 2] = x; np[i * 2 + 1] = y; const k = keyOf(np, pcs);
        if (prev.has(k)) continue; prev.set(k, {kp, i, x, y, pos});
        if (done(np)) {   // reconstruct
          const path = []; let kk = k;
          while (prev.get(kk)) { const e = prev.get(kk); path.unshift([e.i, e.x, e.y]); kk = e.kp; }
          return path;
        }
        nf.push(np);
      }
    }
    fr = nf;
  }
  return null;
}
const MIN = {}; // filled lazily

function drawPiece(g, x, y, w, h, p, o = {}) {
  const r = Math.min(w, h) * .12, m = Math.min(w, h) * .045;
  x += m; y += m; w -= 2 * m; h -= 2 * m;
  g.save();
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = Math.min(w, h) * .12; g.shadowOffsetY = Math.min(w, h) * .06;
  D.rr(g, x, y, w, h, r);
  let c1, c2, ink, rim;
  if (p.t === 'C') { c1 = '#c4402c'; c2 = '#7c1c12'; ink = '#f7d98a'; rim = '#e6c57d'; }
  else if (p.t === 'g') { c1 = '#3b2a20'; c2 = '#150d08'; ink = '#e6c57d'; rim = '#a8803d'; }
  else { c1 = '#e8c48c'; c2 = '#b98a4c'; ink = '#4a2a12'; rim = '#8a5a2a'; }
  const gr = g.createLinearGradient(x, y, x + w * .4, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
  g.fillStyle = gr; g.fill(); g.restore();
  if (p.t === 's') { g.save(); D.rr(g, x, y, w, h, r); g.clip(); D.wood(g, x, y, w, h, {base: '#ddb57c', dark: '#8a5a2a', seed: (p.x + 1) * 7 + p.y, grain: .25}); g.restore(); }
  // gloss
  g.save(); D.rr(g, x, y, w, h, r); g.clip();
  const gl = g.createLinearGradient(x, y, x, y + h * .5); gl.addColorStop(0, 'rgba(255,255,255,.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(x, y, w, h * .5); g.restore();
  g.lineWidth = Math.max(1.2, Math.min(w, h) * .035); g.strokeStyle = rim; D.rr(g, x + w * .06 * (h / Math.max(w, h)) + 3, y + 3, w - 6 - w * .12 * (h / Math.max(w, h)), h - 6, r * .7); g.stroke();
  const n = p.n, sz = Math.min(w, h);
  if (p.t === 'C') {
    D.text(g, '曹', x + w / 2, y + h * .36, {size: sz * .34, color: ink, font: 'serif', weight: 900, shadow: 'rgba(0,0,0,.4)'});
    D.text(g, '操', x + w / 2, y + h * .68, {size: sz * .34, color: ink, font: 'serif', weight: 900, shadow: 'rgba(0,0,0,.4)'});
  } else if (p.t === 'g') {
    if (h > w) { D.text(g, n[0], x + w / 2, y + h * .3, {size: sz * .5, color: ink, font: 'serif', weight: 900}); D.text(g, n[1], x + w / 2, y + h * .7, {size: sz * .5, color: ink, font: 'serif', weight: 900}); }
    else D.text(g, n, x + w / 2, y + h / 2 + 1, {size: sz * .5, color: ink, font: 'serif', weight: 900});
  } else D.text(g, '兵', x + w / 2, y + h / 2 + 1, {size: sz * .5, color: ink, font: 'serif', weight: 900});
  if (o.sel) { g.lineWidth = 3; g.strokeStyle = '#ffd76a'; D.rr(g, x - 2, y - 2, w + 4, h + 4, r + 2); g.stroke(); }
  if (o.glow) { g.save(); g.shadowColor = '#7fffc0'; g.shadowBlur = 18; g.lineWidth = 3; g.strokeStyle = `rgba(120,255,190,${o.glow})`; D.rr(g, x - 2, y - 2, w + 4, h + 4, r + 2); g.stroke(); g.restore(); }
}
function drawBoard(g, x, y, cs, pcs, pos) {
  const W = 4 * cs, H = 5 * cs, f = cs * .32;
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = cs * .3; g.shadowOffsetY = cs * .1;
  D.wood(g, x - f, y - f, W + 2 * f, H + 2 * f, {base: '#8a5530', dark: '#3a1e0c', seed: 21, r: cs * .18});
  g.restore();
  D.wood(g, x - f, y - f, W + 2 * f, H + 2 * f, {base: '#8a5530', dark: '#3a1e0c', seed: 21, r: cs * .18});
  g.fillStyle = '#2a190d'; g.fillRect(x - 2, y - 2, W + 4, H + 4);
  const gr = g.createLinearGradient(x, y, x, y + H); gr.addColorStop(0, '#5a3a20'); gr.addColorStop(1, '#3e2614'); g.fillStyle = gr; g.fillRect(x, y, W, H);
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; D.grid(g, x, y, 4, 5, cs, 'rgba(0,0,0,.22)', 1);
  // exit gap
  g.fillStyle = '#1a0f07'; g.fillRect(x + cs, y + H, cs * 2, f + 1);
  g.fillStyle = 'rgba(178,58,43,.85)'; g.fillRect(x + cs, y + H + f * .55, cs * 2, f * .3);
  D.text(g, '出 口', x + W / 2, y + H + f * .28, {size: Math.max(9, f * .45), color: '#e6c57d', font: 'serif', weight: 700});
}

BX.register({
  id: 'huarongdao', title: '华容道', cat: 'solo', order: 4, sub: '移开众将，放曹操出关',
  desc: '中国古典滑块谜题。在 4×5 的棋盘里移动曹操、五虎上将和小兵，让曹操从底部出口逃出。收录横刀立马等 15 种经典布局，附最少步数与最优提示。',
  kind: 'solo',
  rules: `<p>棋盘 4 列 5 行，有 10 块木牌：<b>曹操</b>（2×2）、关羽（横 2×1）、张飞/赵云/马超/黄忠（竖 1×2，个别布局中有横放）和 4 个<b>兵</b>（1×1），共留两个空格。</p>
<p>每次可把一块木牌沿上下左右滑进空格，不能跳过或旋转。把<b>曹操移到底部正中的出口</b>（最下两行的中间两列）即为成功。</p>
<p><b>计步</b>：同一块木牌连续移动（无论走几格、是否拐弯）只算一步；换一块再动才算新的一步。每个布局显示已知的最少步数（由求解器计算），达到最少步数可得满分印章。</p>
<p><b>操作</b>：按住木牌拖动或朝某方向快速滑动；若木牌只有一种走法，轻点即可移动。键盘：先点选木牌，再用方向键移动。<br>
「提示」会算出当前局面的最优走法并高亮下一步；「撤销」不限次数；「布局」选择关卡，已通关的布局会打勾并记录最佳步数。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#6b4426', dark: '#2a190d', seed: 4});
    const pcs = parse(LAYS[0][1]), cs = h * .82 / 5, x0 = (w - 4 * cs) / 2, y0 = h * .06;
    g.fillStyle = '#3e2614'; g.fillRect(x0, y0, cs * 4, cs * 5);
    for (const p of pcs) drawPiece(g, x0 + p.x * cs, y0 + p.y * cs, p.w * cs, p.h * cs, p);
  },
  create(ctx) {
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let li = BX.clamp(ctx.load('lay', 0), 0, LAYS.length - 1);
    let pcs, pos, steps = 0, lastPiece = -1, undoS = [], time = 0, won = false, started = false, hintMv = null, solCache = null, vis = [], drag = null, sel = -1, exitAnim = null, minCache = ctx.load('mins', {});
    const recs = () => ctx.load('rec', {});
    const bar = K.bar(ctx, [
      {k: 'undo', ic: '↶', t: '撤销', on: () => undo()},
      {k: 'hint', ic: '☞', t: '提示', on: () => hint()},
      {k: 'lay', ic: '▦', t: '布局', on: () => pick()},
      {k: 're', ic: '↻', t: '重摆', on: () => load(li)},
    ]);
    function load(i) {
      li = i; ctx.save('lay', i);
      pcs = parse(LAYS[i][1]); pos = []; pcs.forEach(p => pos.push(p.x, p.y));
      steps = 0; lastPiece = -1; undoS = []; time = 0; won = false; started = false; hintMv = null; solCache = null; sel = -1; drag = null; exitAnim = null;
      vis = pcs.map((p, k) => ({x: p.x, y: p.y - 6 - k * .3, d: k * .04}));
      ctx.sfx('shuffle');
      if (minCache[i] == null) ctx.after(30, () => { const s = solve(pos.slice(), pcs); if (s) { minCache[i] = s.length; ctx.save('mins', minCache); } });
    }
    load(li);
    const minOf = i => minCache[i];
    function pick() {
      const R = recs();
      K.picker(ctx, '选择布局', LAYS.map(([n, s], i) => ({
        label: n, sub: R[i] != null ? `最佳 ${R[i]} / 最少 ${minOf(i) != null ? minOf(i) : '?'}` : minOf(i) != null ? `最少 ${minOf(i)} 步` : '', done: R[i] != null, cur: i === li,
        draw(g, w, h) { const ps = parse(s), cs = h * .92 / 5, x0 = (w - 4 * cs) / 2, y0 = h * .04; g.fillStyle = '#3e2614'; g.fillRect(x0, y0, cs * 4, cs * 5); for (const p of ps) drawPiece(g, x0 + p.x * cs, y0 + p.y * cs, p.w * cs, p.h * cs, p); },
      })), i => load(i));
    }
    function occFree(i, nx, ny) {
      const p = pcs[i]; if (nx < 0 || ny < 0 || nx + p.w > 4 || ny + p.h > 5) return false;
      for (let j = 0; j < pcs.length; j++) { if (j === i) continue; const q = pcs[j], qx = pos[j * 2], qy = pos[j * 2 + 1]; if (nx < qx + q.w && nx + p.w > qx && ny < qy + q.h && ny + p.h > qy) return false; }
      return true;
    }
    function stepPiece(i, dx, dy) {
      const nx = pos[i * 2] + dx, ny = pos[i * 2 + 1] + dy; if (!occFree(i, nx, ny)) return false;
      if (lastPiece !== i) { undoS.push(JSON.stringify([pos, steps, lastPiece])); steps++; lastPiece = i; }
      else if (undoS.length) { /* same step continues */ }
      pos[i * 2] = nx; pos[i * 2 + 1] = ny; started = true;
      if (hintMv && hintMv[0] === i && nx === hintMv[1] && ny === hintMv[2]) { if (solCache && solCache.path[0] === hintMv) solCache.path.shift(); hintMv = null; }
      ctx.sfx('move');
      return true;
    }
    function undo() {
      if (!undoS.length || won) { ctx.sfx('error'); return; }
      [pos, steps, lastPiece] = JSON.parse(undoS.pop()); lastPiece = -1; hintMv = null; solCache = null; ctx.sfx('whoosh');
    }
    function checkWin() {
      const ci = pcs.findIndex(p => p.t === 'C');
      if (won || pos[ci * 2] !== 1 || pos[ci * 2 + 1] !== 3) return;
      won = true; hintMv = null;
      const mn = minOf(li), R = recs(), old = R[li]; if (old == null || steps < old) { R[li] = steps; if (!BX.test) ctx.save('rec', R); }
      ctx.best('s_' + li, steps, 'min');
      exitAnim = {t: 0}; ctx.sfx('gong');
      ctx.after(700, () => { fx.rain(cv.w, cv.h, 60); ctx.sfx('win'); });
      const perfect = mn != null && steps <= mn;
      ctx.end({win: true, title: perfect ? '神机妙算' : '曹操脱困', text: `${LAYS[li][0]} · 用时 ${K.fmt(time)} 步数 ${steps}` + (mn != null ? `（最少 ${mn}）` : '') + (old == null || steps < old ? ' · 新纪录！' : ` · 最佳 ${old}`), delay: 2000});
    }
    function hint() {
      if (won) return;
      let path;
      const k = keyOf(pos, pcs);
      if (solCache && solCache.k === k && solCache.path.length) path = solCache.path;
      else {
        say('军师推演中…');
        path = solve(pos.slice(), pcs); if (!path) { ctx.toast('无解？'); return; }
        solCache = {k, path};
      }
      if (!path.length) return;
      hintMv = path[0];
      // keep cache key for state after this move
      const np = pos.slice(); np[hintMv[0] * 2] = hintMv[1]; np[hintMv[0] * 2 + 1] = hintMv[2];
      solCache = {k: keyOf(np, pcs), path: path.slice(1), pending: hintMv};
      ctx.toast(`还需 ${path.length} 步`); ctx.sfx('tick');
    }
    /* apply a full one-step move (piece slides along a path) — used by hint following & tests */
    function applyMove(i, x, y) {
      const tgt = reach(pos, pcs, i).find(([a, b]) => a === x && b === y); if (!tgt) return false;
      if (lastPiece !== i) { undoS.push(JSON.stringify([pos, steps, lastPiece])); steps++; lastPiece = i; }
      pos[i * 2] = x; pos[i * 2 + 1] = y; started = true;
      if (hintMv && hintMv[0] === i && hintMv[1] === x && hintMv[2] === y) hintMv = null;
      if (solCache && solCache.pending && !(solCache.pending[0] === i && solCache.pending[1] === x && solCache.pending[2] === y)) solCache = null;
      if (solCache) solCache.pending = null;
      ctx.sfx('move'); checkWin(); return true;
    }

    /* ---------- layout & input ---------- */
    let L = null;
    function layout() {
      const A = bar.area(cv.w, cv.h), top = 40;
      const cs = Math.min((A.w - 30) / 4.7, (A.h - top - 20) / 5.75, 120);
      L = {cs, x: A.x + (A.w - 4 * cs) / 2, y: top + (A.h - top - 5.65 * cs) / 2 + cs * .3, A, top};
    }
    const pieceAt = p => { for (let i = 0; i < pcs.length; i++) { const q = pcs[i], x = L.x + pos[i * 2] * L.cs, y = L.y + pos[i * 2 + 1] * L.cs; if (p.x >= x && p.x <= x + q.w * L.cs && p.y >= y && p.y <= y + q.h * L.cs) return i; } return -1; };
    ctx.on(cv.cv, 'pointerdown', e => {
      if (won || !L) return; const p = cv.pos(e), i = pieceAt(p);
      if (i < 0) { sel = -1; return; }
      drag = {i, sx: p.x, sy: p.y, gx: p.x - pos[i * 2] * L.cs, gy: p.y - pos[i * 2 + 1] * L.cs, moved: false, pid: e.pointerId, t0: performance.now(), x0: pos[i * 2], y0: pos[i * 2 + 1]};
      sel = i;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const p = cv.pos(e); if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
      if (!drag.moved) return;
      const i = drag.i, tx = (p.x - drag.gx) / L.cs, ty = (p.y - drag.gy) / L.cs;
      for (let k = 0; k < 10; k++) {
        const dx = tx - pos[i * 2], dy = ty - pos[i * 2 + 1];
        const ax = Math.abs(dx) >= .5, ay = Math.abs(dy) >= .5; if (!ax && !ay) break;
        const first = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        let ok = false;
        for (const a of first === 'x' ? ['x', 'y'] : ['y', 'x']) { if (a === 'x' && ax && stepPiece(i, Math.sign(dx), 0)) { ok = true; break; } if (a === 'y' && ay && stepPiece(i, 0, Math.sign(dy))) { ok = true; break; } }
        if (!ok) break;
      }
      // fractional offset preview
      const dx = tx - pos[i * 2], dy = ty - pos[i * 2 + 1];
      drag.fx = Math.abs(dx) >= Math.abs(dy) && occFree(i, pos[i * 2] + Math.sign(dx), pos[i * 2 + 1]) ? BX.clamp(dx, -.45, .45) : 0;
      drag.fy = Math.abs(dy) > Math.abs(dx) && occFree(i, pos[i * 2], pos[i * 2 + 1] + Math.sign(dy)) ? BX.clamp(dy, -.45, .45) : 0;
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      const p = cv.pos(e), dt = performance.now() - d.t0;
      if (d.moved && d.x0 === pos[d.i * 2] && d.y0 === pos[d.i * 2 + 1]) {   // short swipe: move one cell in swipe direction
        const dx = p.x - d.sx, dy = p.y - d.sy;
        if (dt < 350 && Math.hypot(dx, dy) > L.cs * .15) { const ok = Math.abs(dx) > Math.abs(dy) ? stepPiece(d.i, Math.sign(dx), 0) : stepPiece(d.i, 0, Math.sign(dy)); if (!ok) ctx.sfx('error'); }
      } else if (!d.moved) {
        const mv = reach(pos, pcs, d.i).filter(([x, y]) => Math.abs(x - pos[d.i * 2]) + Math.abs(y - pos[d.i * 2 + 1]) === 1);
        if (mv.length === 1) stepPiece(d.i, mv[0][0] - pos[d.i * 2], mv[0][1] - pos[d.i * 2 + 1]);
        else if (mv.length > 1) { // tap: prefer the hint move, else toward tap side
          if (hintMv && hintMv[0] === d.i) applyMove(d.i, hintMv[1], hintMv[2]);
          else ctx.toast('有多个方向，请拖动');
        } else ctx.sfx('tick');
      }
      checkWin();
    };
    ctx.on(cv.cv, 'pointerup', end); ctx.on(cv.cv, 'pointercancel', end);

    /* ---------- draw ---------- */
    let bgC = null, bgKey = '';
    return {
      frame(dt) {
        const g = cv.g; cv.clear(); layout();
        if (started && !won) time += dt;
        const key = cv.w + 'x' + cv.h + cv.dpr;
        if (key !== bgKey) { bgKey = key; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'wood'); }
        g.drawImage(bgC, 0, 0, cv.w, cv.h);
        const {cs, x, y} = L;
        drawBoard(g, x, y, cs, pcs, pos);
        const mn = minOf(li), R = recs();
        D.text(g, `「${LAYS[li][0]}」  步数 ${steps}` + (mn != null ? ` / 最少 ${mn}` : ''), L.A.x + L.A.w / 2, 22, {size: 17, color: '#f3e2c0', font: 'serif', weight: 800, shadow: true});
        g.save(); g.beginPath(); g.rect(x - 2, y - 2, 4 * cs + 4, 5 * cs + 4 + (exitAnim ? cs * 3 : 0)); g.clip();
        const k = 1 - Math.exp(-dt * 18);
        pcs.forEach((p, i) => {
          const v = vis[i]; let tx = pos[i * 2], ty = pos[i * 2 + 1];
          if (drag && drag.i === i && drag.moved) { tx += drag.fx || 0; ty += drag.fy || 0; }
          if (exitAnim && p.t === 'C') { exitAnim.t += dt; ty += Math.max(0, exitAnim.t - .2) * Math.max(0, exitAnim.t - .2) * 6; }
          if (v.d > 0) v.d -= dt; else { v.x += (tx - v.x) * k; v.y += (ty - v.y) * k; }
          let glow = 0; if (hintMv && hintMv[0] === i) glow = .55 + .45 * Math.sin(performance.now() / 120);
          drawPiece(g, x + v.x * cs, y + v.y * cs, p.w * cs, p.h * cs, p, {sel: sel === i && !won && (!drag || !drag.moved), glow});
        });
        if (hintMv) { // ghost destination
          const p = pcs[hintMv[0]]; g.save(); g.globalAlpha = .35 + .2 * Math.sin(performance.now() / 120); g.setLineDash([6, 5]); g.strokeStyle = '#7fffc0'; g.lineWidth = 2.5;
          D.rr(g, x + hintMv[1] * cs + 4, y + hintMv[2] * cs + 4, p.w * cs - 8, p.h * cs - 8, cs * .1); g.stroke(); g.restore();
        }
        g.restore();
        if (R[li] != null && !won) K.seal(g, x + 4 * cs + cs * .25, y - cs * .05, Math.max(26, cs * .36), R[li] <= (mn || 0) ? '优' : '过', .15);
        fx.draw(g, dt);
        if (!won) say(`用时 ${K.fmt(time)} · ` + (BX.TOUCH.matches ? '拖动或滑动木牌' : '拖动木牌，或点选后用方向键'));
        bar.dis('undo', !undoS.length || won); bar.dis('hint', won);
      },
      key(e) {
        if (won || sel < 0) return;
        const m = {ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0]}[e.code];
        if (m) { if (!stepPiece(sel, m[0], m[1])) ctx.sfx('error'); checkWin(); }
        if (e.code === 'KeyZ') undo(); if (e.code === 'KeyH') hint();
      },
      debug: {
        get pos() { return pos; }, get pcs() { return pcs; }, get hintMv() { return hintMv; }, get steps() { return steps; }, get L() { return L; }, applyMove, load, solve: () => solve(pos.slice(), pcs), mins: () => minCache,
      },
    };
  },
});
