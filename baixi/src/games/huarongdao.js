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
const MINS = [81, 70, 72, 60, 72, 47, 54, 70, 79, 60, 56, 82, 73, 72, 35];   // verified with solve()

function drawPiece(g, x, y, w, h, p, o = {}) {
  const r = Math.min(w, h) * .12, m = Math.min(w, h) * .045;
  x += m; y += m; w -= 2 * m; h -= 2 * m;
  g.save();
  const lf = o.lift || 0;
  g.shadowColor = `rgba(0,0,0,${.5 + .1 * lf})`; g.shadowBlur = Math.min(w, h) * (.12 + .14 * lf); g.shadowOffsetY = Math.min(w, h) * (.06 + .07 * lf);
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
  howto: ['<b>按住木牌拖动</b>：木牌跟着手指走，一次可连走几格、拐弯；朝某方向<b>快速一划</b>走一格，<b>用力一甩</b>滑到底。轻点木牌会朝你点的那一侧移动。', '选中木牌时，能去的空位会用虚线框标出。', '💡 提示高亮最优的下一步（再点发光的木牌就照做）；「演示」从当前局面自动走完最优解，点棋盘可随时停下。', '「布局」选关，通关后「再来一局」进入下一个没过的布局。键盘：点选木牌后用方向键移动，Z 撤销、H 提示。'],
  rules: `<p>棋盘 4 列 5 行，有 10 块木牌：<b>曹操</b>（2×2）、关羽（横 2×1）、张飞/赵云/马超/黄忠（竖 1×2，个别布局中有横放）和 4 个<b>兵</b>（1×1），共留两个空格。</p>
<p>每次可把一块木牌沿上下左右滑进空格，不能跳过或旋转。把<b>曹操移到底部正中的出口</b>（最下两行的中间两列）即为成功。</p>
<p><b>计步</b>：同一块木牌连续移动（无论走几格、是否拐弯）只算一步；换一块再动才算新的一步。每个布局显示已知的最少步数（由求解器计算），达到最少步数可得满分印章。</p>
<p><b>操作</b>：按住木牌拖动或朝某方向快速滑动；若木牌只有一种走法，轻点即可移动。键盘：先点选木牌，再用方向键移动。<br>
💡「提示」会算出当前局面的最优走法并高亮下一步；「演示」从当前局面开始自动播放最优解（用过演示的这一局不计纪录）；「撤销」不限次数；「布局」选择关卡，已通关的布局会打勾并记录最佳步数。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#6b4426', dark: '#2a190d', seed: 4});
    const pcs = parse(LAYS[0][1]), cs = h * .82 / 5, x0 = (w - 4 * cs) / 2, y0 = h * .06;
    g.fillStyle = '#3e2614'; g.fillRect(x0, y0, cs * 4, cs * 5);
    for (const p of pcs) drawPiece(g, x0 + p.x * cs, y0 + p.y * cs, p.w * cs, p.h * cs, p);
  },
  create(ctx) {
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let li = BX.clamp(ctx.load('lay', 0), 0, LAYS.length - 1);
    let pcs, pos, steps = 0, lastPiece = -1, undoS = [], time = 0, won = false, started = false, hintMv = null, solCache = null, vis = [], drag = null, sel = -1, exitAnim = null, minCache = Object.assign({}, MINS);
    let demo = null, demoUsed = false;
    const recs = () => ctx.load('rec', {});
    const bar = K.bar(ctx, [
      {k: 'undo', ic: '↶', t: '撤销', on: () => undo()},
      {k: 'lay', ic: '▦', t: '布局', on: () => { stopDemo(); pick(); }},
      {k: 'demo', ic: '▶', t: '演示', on: () => demo ? stopDemo() : startDemo()},
      {k: 're', ic: '↻', t: '重摆', on: () => { stopDemo(); load(li); }},
    ]);
    function load(i) {
      li = i; ctx.save('lay', i);
      pcs = parse(LAYS[i][1]); pos = []; pcs.forEach(p => pos.push(p.x, p.y));
      steps = 0; lastPiece = -1; undoS = []; time = 0; won = false; started = false; hintMv = null; solCache = null; sel = -1; drag = null; exitAnim = null; demoUsed = false;
      vis = pcs.map((p, k) => ({x: p.x, y: p.y - 6 - k * .3, d: k * .04}));
      ctx.sfx('shuffle');
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
    /* solution playback from the current position */
    function startDemo() {
      if (won || thinking) return;
      thinking = true; say('军师推演中…');
      ctx.after(40, () => {
        thinking = false; const path = solve(pos.slice(), pcs); if (!path || !path.length) return;
        demo = {path, t: 0}; demoUsed = true; hintMv = null; sel = -1; bar.label('demo', '停止', '■'); bar.on('demo', true);
        ctx.toast(`演示最优解：还需 ${path.length} 步，点棋盘可停下`, 2200);
        const tick = () => { if (!demo || won) return; const [i, x, y] = demo.path.shift(); lastPiece = -1; applyMove(i, x, y); if (!demo.path.length || won) { stopDemo(); return; } demo.tm = ctx.after(560, tick); };
        demo.tm = ctx.after(350, tick);
      });
    }
    function stopDemo() { if (!demo) return; if (demo.tm) ctx.cancel(demo.tm); demo = null; bar.label('demo', '演示', '▶'); bar.on('demo', false); }
    function undo() {
      stopDemo();
      if (!undoS.length || won) { ctx.sfx('error'); return; }
      [pos, steps, lastPiece] = JSON.parse(undoS.pop()); lastPiece = -1; hintMv = null; solCache = null; ctx.sfx('whoosh');
    }
    function checkWin() {
      const ci = pcs.findIndex(p => p.t === 'C');
      if (won || pos[ci * 2] !== 1 || pos[ci * 2 + 1] !== 3) return;
      won = true; hintMv = null; ctx.buzz(30);
      const mn = minOf(li), R = recs(), old = R[li];
      if (!demoUsed) { if (old == null || steps < old) { R[li] = steps; if (!BX.test) ctx.save('rec', R); } ctx.best('s_' + li, steps, 'min'); }
      // 再来一局 → next layout not yet cleared
      let nx = li; for (let k = 1; k <= LAYS.length; k++) { const j = (li + k) % LAYS.length; if (R[j] == null) { nx = j; break; } if (k === LAYS.length) nx = (li + 1) % LAYS.length; }
      if (!demoUsed) ctx.save('lay', nx);
      exitAnim = {t: 0}; ctx.sfx('gong');
      ctx.after(700, () => { fx.rain(cv.w, cv.h, 60); ctx.sfx('win'); });
      const perfect = mn != null && steps <= mn;
      if (demoUsed) { ctx.end({win: true, title: '演示完毕', text: `${LAYS[li][0]} · 最优解共 ${mn != null ? mn : steps} 步，自己试试吧！`, delay: 2000}); return; }
      ctx.end({win: true, title: perfect ? '神机妙算' : '曹操脱困', text: `${LAYS[li][0]} · 用时 ${K.fmt(time)} 步数 ${steps}` + (mn != null ? `（最少 ${mn}）` : '') + (old == null || steps < old ? ' · 新纪录！' : ` · 最佳 ${old}`) + (nx !== li ? ` · 下一关「${LAYS[nx][0]}」` : ''), delay: 2000});
    }
    let thinking = false;
    function hint() {
      if (won) return;
      let path;
      const k = keyOf(pos, pcs);
      if (solCache && solCache.k === k && solCache.path.length) path = solCache.path;
      else {
        if (thinking) return; thinking = true; say('军师推演中…');
        ctx.after(40, () => { thinking = false; const pth = solve(pos.slice(), pcs); if (!pth) { ctx.toast('无解？'); return; } solCache = {k, path: pth}; if (keyOf(pos, pcs) === k) hint(); });
        return;
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
    /* forgiving touch: nearest block within `m` px of the finger (taps on the dark seams between blocks) */
    const pieceNear = (p, m) => { let best = -1, bd = m; for (let i = 0; i < pcs.length; i++) { const q = pcs[i], x = L.x + pos[i * 2] * L.cs, y = L.y + pos[i * 2 + 1] * L.cs, dx = Math.max(x - p.x, 0, p.x - x - q.w * L.cs), dy = Math.max(y - p.y, 0, p.y - y - q.h * L.cs), dd = Math.hypot(dx, dy); if (dd < bd) { bd = dd; best = i; } } return best; };
    const pieceAt = p => { for (let i = 0; i < pcs.length; i++) { const q = pcs[i], x = L.x + pos[i * 2] * L.cs, y = L.y + pos[i * 2 + 1] * L.cs; if (p.x >= x && p.x <= x + q.w * L.cs && p.y >= y && p.y <= y + q.h * L.cs) return i; } return -1; };
    /* drag: the block tracks the finger exactly along one axis, commits a cell whenever it passes the half-way line (so one
       gesture can slide several cells and turn corners), and pushes against walls/blocks with a short rubber-band give. */
    const rubber = d => Math.sign(d) * .09 * (1 - Math.exp(-Math.abs(d) * 4));
    function dragTo(p) {
      const d = drag, i = d.i, tx = (p.x - d.gx) / L.cs, ty = (p.y - d.gy) / L.cs;
      for (let k = 0; k < 12; k++) {
        const dx = tx - pos[i * 2], dy = ty - pos[i * 2 + 1];
        const ax = Math.abs(dx) >= .5, ay = Math.abs(dy) >= .5; if (!ax && !ay) break;
        const first = d.axis || (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y');
        let ok = false;
        for (const a of first === 'x' ? ['x', 'y'] : ['y', 'x']) { if (a === 'x' && ax && stepPiece(i, Math.sign(dx), 0)) { ok = true; break; } if (a === 'y' && ay && stepPiece(i, 0, Math.sign(dy))) { ok = true; break; } }
        if (!ok) break;
        d.bump = 0;
      }
      const dx = tx - pos[i * 2], dy = ty - pos[i * 2 + 1], adx = Math.abs(dx), ady = Math.abs(dy);
      // axis lock with hysteresis (no flicker between axes on diagonal drags); free again near the cell centre
      if (adx < .08 && ady < .08) d.axis = null;
      else if (!d.axis || (d.axis === 'x' ? ady > adx + .15 : adx > ady + .15)) d.axis = adx >= ady ? 'x' : 'y';
      const freeX = dx && occFree(i, pos[i * 2] + Math.sign(dx), pos[i * 2 + 1]), freeY = dy && occFree(i, pos[i * 2], pos[i * 2 + 1] + Math.sign(dy));
      let fxv = 0, fyv = 0;
      if (d.axis === 'x') fxv = freeX ? BX.clamp(dx, -.5, .5) : rubber(dx);
      else if (d.axis === 'y') fyv = freeY ? BX.clamp(dy, -.5, .5) : rubber(dy);
      // first contact with a wall: a soft knock (once per push)
      const pushing = (d.axis === 'x' && !freeX && adx > .12) || (d.axis === 'y' && !freeY && ady > .12);
      if (pushing && !d.bump) { d.bump = 1; ctx.sfx('tick'); }
      else if (!pushing && (adx < .05 && ady < .05)) d.bump = 0;
      d.fx = fxv; d.fy = fyv;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (demo) { stopDemo(); return; }
      if (won || !L || (drag && drag.pid !== e.pointerId)) return;
      const p = cv.pos(e); let i = pieceAt(p);
      if (i < 0) i = pieceNear(p, e.pointerType === 'mouse' ? 4 : 10);
      if (i < 0) { sel = -1; return; }
      drag = {i, sx: p.x, sy: p.y, gx: p.x - pos[i * 2] * L.cs, gy: p.y - pos[i * 2 + 1] * L.cs, moved: false, pid: e.pointerId, t0: performance.now(), x0: pos[i * 2], y0: pos[i * 2 + 1], smp: [{x: p.x, y: p.y, t: e.timeStamp}], fx: 0, fy: 0, axis: null, bump: 0, mouse: e.pointerType === 'mouse'};
      sel = i;
      try { cv.cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const pts = ctx.points(e, cv.cv); K.track(drag.smp, pts);
      const p = pts[pts.length - 1];
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > (drag.mouse ? 4 : 7)) {
        drag.moved = true;
        // grab offset re-based so the block starts moving from where it is (no jump of the threshold distance)
        const dx = p.x - drag.sx, dy = p.y - drag.sy;
        drag.gx += Math.abs(dx) >= Math.abs(dy) ? 0 : dx; drag.gy += Math.abs(dx) >= Math.abs(dy) ? dy : 0;
      }
      if (!drag.moved) return;
      dragTo(p);
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      const p = cv.pos(e), dt = performance.now() - d.t0;
      if (d.moved && e.type !== 'pointercancel') { K.lift(d.smp, p, e.timeStamp); dragTo(p); }
      drag = null;
      if (d.moved) {
        const vel = K.vel(d.smp, 80), vx = vel.vx * 1000 / L.cs, vy = vel.vy * 1000 / L.cs;   // cells per second
        const movedCells = d.x0 !== pos[d.i * 2] || d.y0 !== pos[d.i * 2 + 1];
        // flick: keep going in the throw direction (a short quick swipe moves one cell; a hard flick slides to the end)
        const ax = d.axis || (Math.abs(vx) >= Math.abs(vy) ? 'x' : 'y'), v = ax === 'x' ? vx : vy, off = ax === 'x' ? d.fx : d.fy;
        const sx = ax === 'x' ? Math.sign(v) : 0, sy = ax === 'y' ? Math.sign(v) : 0;
        const dist = Math.hypot(p.x - d.sx, p.y - d.sy);
        const hard = Math.abs(v) > 9 && off * Math.sign(v) > -.3;   // hard flick: slide on to the end of the free run
        const flick = hard || (!movedCells ? Math.abs(v) > 2.5 && dist > L.cs * .12 && (off === 0 || Math.sign(off) === Math.sign(v))
          : Math.abs(v) > 6 && off * Math.sign(v) > .18);
        if (flick) {
          let n = 0; const max = hard ? 3 : 1;
          while (n < max && stepPiece(d.i, sx, sy)) n++;
          if (!n && !movedCells) { ctx.sfx('error'); ctx.buzz(10); }
        } else if (!movedCells && dt < 300 && dist > L.cs * .15) {   // short swipe that stayed under half a cell
          const dx = p.x - d.sx, dy = p.y - d.sy;
          const ok = Math.abs(dx) > Math.abs(dy) ? stepPiece(d.i, Math.sign(dx), 0) : stepPiece(d.i, 0, Math.sign(dy)); if (!ok) { ctx.sfx('error'); ctx.buzz(10); }
        }
        // release: the block springs from where the finger left it to the nearest cell (the frame loop eases it in)
      } else {
        if (e.type === 'pointercancel') return;
        const mv = reach(pos, pcs, d.i).filter(([x, y]) => Math.abs(x - pos[d.i * 2]) + Math.abs(y - pos[d.i * 2 + 1]) === 1);
        if (hintMv && hintMv[0] === d.i) applyMove(d.i, hintMv[1], hintMv[2]);
        else if (mv.length === 1) stepPiece(d.i, mv[0][0] - pos[d.i * 2], mv[0][1] - pos[d.i * 2 + 1]);
        else if (mv.length > 1) { // tap: move toward the side of the piece that was tapped
          const q = pcs[d.i], cx = L.x + (pos[d.i * 2] + q.w / 2) * L.cs, cy = L.y + (pos[d.i * 2 + 1] + q.h / 2) * L.cs;
          let best = null, bs = -1e9; for (const [x, y] of mv) { const dx = x - pos[d.i * 2], dy = y - pos[d.i * 2 + 1], sc = dx * (p.x - cx) + dy * (p.y - cy); if (sc > bs) { bs = sc; best = [dx, dy]; } }
          stepPiece(d.i, best[0], best[1]);
        } else { ctx.sfx('error'); ctx.buzz(12); }
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
        D.text(g, `「${LAYS[li][0]}」  步数 ${steps}` + (mn != null ? ` / 最少 ${mn}` : '') + (R[li] != null ? ` · 最佳 ${R[li]}` : ''), L.A.x + L.A.w / 2, 22, {size: L.A.w < 380 ? 15 : 17, color: '#f3e2c0', font: 'serif', weight: 800, shadow: true});
        g.save(); g.beginPath(); g.rect(x - 2, y - 2, 4 * cs + 4, 5 * cs + 4 + (exitAnim ? cs * 3 : 0)); g.clip();
        const k = 1 - Math.exp(-dt * 20), lifted = [];
        pcs.forEach((p, i) => {
          const v = vis[i]; let tx = pos[i * 2], ty = pos[i * 2 + 1];
          const held = drag && drag.i === i && drag.moved;
          if (held) { tx += drag.fx || 0; ty += drag.fy || 0; }
          if (exitAnim && p.t === 'C') { exitAnim.t += dt; ty += Math.max(0, exitAnim.t - .2) * Math.max(0, exitAnim.t - .2) * 6; }
          if (v.d > 0) v.d -= dt;
          else if (held) { v.x = tx; v.y = ty; }   // under the finger: exact, no smoothing lag
          else { v.x += (tx - v.x) * k; v.y += (ty - v.y) * k; if (Math.abs(tx - v.x) + Math.abs(ty - v.y) < .002) { v.x = tx; v.y = ty; } }
          const lt = held ? 1 : drag && drag.i === i ? .4 : 0; v.lf = (v.lf || 0) + (lt - (v.lf || 0)) * (1 - Math.exp(-dt * (lt > (v.lf || 0) ? 30 : 14)));
          let glow = 0; if (hintMv && hintMv[0] === i) glow = .55 + .45 * Math.sin(performance.now() / 120);
          const px = x + v.x * cs, py = y + v.y * cs, pw = p.w * cs, ph = p.h * cs;
          if (v.lf > .01) { const sc = 1 + .035 * v.lf; lifted.push(() => { g.save(); g.translate(px + pw / 2, py + ph / 2); g.scale(sc, sc); g.translate(-px - pw / 2, -py - ph / 2); drawPiece(g, px, py, pw, ph, p, {sel: sel === i && !won && !held, glow, lift: v.lf}); g.restore(); }); }
          else drawPiece(g, px, py, pw, ph, p, {sel: sel === i && !won && (!drag || !drag.moved), glow});
        });
        lifted.forEach(f => f());
        if (sel >= 0 && !won && !demo && !(drag && drag.moved) && ctx.pref('hints')) {   // where the selected piece can go (one step)
          const q = pcs[sel]; g.save(); g.setLineDash([4, 5]); g.strokeStyle = 'rgba(255,215,106,.55)'; g.lineWidth = 2;
          for (const [mx, my] of reach(pos, pcs, sel)) if (Math.abs(mx - pos[sel * 2]) + Math.abs(my - pos[sel * 2 + 1]) === 1) { D.rr(g, x + mx * cs + 6, y + my * cs + 6, q.w * cs - 12, q.h * cs - 12, cs * .1); g.stroke(); }
          g.restore();
        }
        if (hintMv) { // ghost destination
          const p = pcs[hintMv[0]]; g.save(); g.globalAlpha = .35 + .2 * Math.sin(performance.now() / 120); g.setLineDash([6, 5]); g.strokeStyle = '#7fffc0'; g.lineWidth = 2.5;
          D.rr(g, x + hintMv[1] * cs + 4, y + hintMv[2] * cs + 4, p.w * cs - 8, p.h * cs - 8, cs * .1); g.stroke(); g.restore();
        }
        g.restore();
        if (R[li] != null && !won) K.seal(g, x + 4 * cs + cs * .25, y - cs * .05, Math.max(26, cs * .36), R[li] <= (mn || 0) ? '优' : '过', .15);
        fx.draw(g, dt);
        if (!won && !thinking) say(demo ? `演示中 · 还剩 ${demo.path.length} 步 · 点棋盘停下` : `用时 ${K.fmt(time)} · ` + (BX.TOUCH.matches ? '拖动、滑动或轻点木牌' : '拖动木牌，或点选后用方向键'));
        bar.dis('undo', !undoS.length || won); bar.dis('demo', won);
      },
      hint: () => { stopDemo(); hint(); },
      key(e) {
        if (won) return;
        if (e.code === 'KeyZ') { undo(); return; } if (e.code === 'KeyH') { stopDemo(); hint(); return; }
        const m = {ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0]}[e.code];
        if (m && sel < 0) { sel = pcs.findIndex(p => p.t === 'C'); return; }
        if (m && !demo) { if (!stepPiece(sel, m[0], m[1])) ctx.sfx('error'); checkWin(); }
      },
      destroy() { stopDemo(); },
      debug: {
        get vis() { return vis; }, get pos() { return pos; }, get pcs() { return pcs; }, get hintMv() { return hintMv; }, get steps() { return steps; }, get L() { return L; }, applyMove, load, solve: () => solve(pos.slice(), pcs), mins: () => minCache,
      },
    };
  },
});
