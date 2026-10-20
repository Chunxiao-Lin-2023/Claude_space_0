/* 七巧板 — 单人。七块经典板拼出剪影：拖动移动、轻点旋转 45°、双击翻转平行四边形，自动吸附，覆盖检测通关。 */
const D = BX.draw, K = BX.data.slkit;
/* 每题 = [名称, 类别, 整体旋转(45°倍数), 解法[[块, k(45°顺时针), 翻转, x, y]]]；解法由穷举求解器生成，保证可拼出。块：0/1 大三角 2 中三角 3/4 小三角 5 正方形 6 平行四边形 */
const PUZ = [["正方形","形",1,[[0,4,0,2,2],[1,6,0,2,2],[2,5,0,2,4],[3,2,0,2,2],[4,0,0,3,2],[5,0,0,2,2],[6,0,0,0,2]]],
  ["长方形","形",0,[[0,0,0,0,0],[1,4,0,2,2],[2,5,0,3,1],[3,4,0,4,1],[4,6,0,2,2],[5,0,0,3,1],[6,2,1,3,2]]],
  ["三角形","形",1,[[0,2,0,2,0],[1,0,0,2,0],[2,3,0,2,2],[3,6,0,0,2],[4,0,0,0,3],[5,0,0,0,2],[6,2,1,1,2]]],
  ["平行四边形","形",0,[[0,4,0,2,2],[1,0,0,4,0],[2,5,0,3,1],[3,4,0,4,1],[4,6,0,2,2],[5,0,0,3,1],[6,2,1,3,2]]],
  ["梯形","形",0,[[0,4,0,2,2],[1,0,0,2,0],[2,1,0,4,0],[3,4,0,4,2],[4,6,0,5,2],[5,0,0,4,1],[6,0,1,4,1]]],
  ["箭头","形",0,[[0,6,0,2,2],[1,0,0,2,2],[2,5,0,1,2],[3,4,0,2,2],[4,6,0,0,3],[5,0,0,1,2],[6,2,1,1,3]]],
  ["山","字",0,[[0,6,0,0,2],[1,4,0,5,2],[2,5,0,2,2],[3,2,0,1,0],[4,0,0,4,0],[5,0,0,2,0],[6,0,1,4,1]]],
  ["凸","字",0,[[0,0,0,1,0],[1,4,0,3,2],[2,5,0,1,3],[3,6,0,0,3],[4,4,0,3,3],[5,0,0,3,2],[6,0,1,3,2]]],
  ["门","字",0,[[0,0,0,0,0],[1,2,0,4,0],[2,1,0,2,0],[3,6,0,3,2],[4,4,0,1,3],[5,0,0,3,2],[6,2,0,1,1]]],
  ["房子","物",0,[[0,4,0,2,2],[1,6,0,2,2],[2,5,0,2,3],[3,4,0,3,3],[4,6,0,1,4],[5,0,0,2,3],[6,2,1,2,4]]],
  ["火箭","物",0,[[0,0,0,1,1],[1,4,0,3,3],[2,1,0,2,0],[3,4,0,2,4],[4,6,0,3,4],[5,0,0,2,3],[6,0,1,2,3]]],
  ["帆船","物",0,[[0,4,0,3,3],[1,6,0,3,3],[2,3,0,3,1],[3,2,0,3,3],[4,0,0,4,3],[5,0,0,3,3],[6,0,0,1,3]]],
  ["钻石","物",0,[[0,2,0,2,1],[1,0,0,2,1],[2,5,0,1,1],[3,6,0,0,1],[4,4,0,3,1],[5,0,0,3,0],[6,0,1,3,0]]],
  ["宫灯","物",0,[[0,0,0,1,0],[1,4,0,3,2],[2,7,0,0,2],[3,6,0,3,2],[4,0,0,2,2],[5,0,0,1,2],[6,0,1,4,2]]],
  ["靴子","物",0,[[0,0,0,0,0],[1,4,0,2,2],[2,5,0,1,3],[3,6,0,0,3],[4,4,0,3,3],[5,0,0,3,2],[6,0,1,3,2]]],
  ["锤子","物",0,[[0,2,0,2,0],[1,6,0,1,3],[2,7,0,2,1],[3,6,0,0,1],[4,0,0,2,0],[5,0,0,3,0],[6,2,1,3,3]]],
  ["茶碗","物",0,[[0,2,0,2,0],[1,0,0,4,0],[2,5,0,3,1],[3,4,0,4,1],[4,6,0,2,2],[5,0,0,3,1],[6,2,1,3,2]]],
  ["小船","物",0,[[0,0,0,1,0],[1,4,0,3,2],[2,5,0,1,3],[3,4,0,3,3],[4,0,0,4,2],[5,0,0,3,2],[6,0,1,3,2]]],
  ["茶壶","物",0,[[0,4,0,2,2],[1,6,0,2,2],[2,5,0,1,3],[3,4,0,3,3],[4,0,0,4,2],[5,0,0,3,2],[6,0,1,3,2]]],
  ["飞机","物",0,[[0,4,0,3,2],[1,4,0,4,3],[2,3,0,4,1],[3,6,0,5,2],[4,0,0,2,2],[5,0,0,4,1],[6,0,1,2,1]]],
  ["亭子","物",0,[[0,2,0,3,0],[1,6,0,2,3],[2,1,0,1,0],[3,6,0,3,1],[4,4,0,2,3],[5,0,0,1,1],[6,0,1,2,2]]],
  ["王冠","物",0,[[0,6,0,0,2],[1,4,0,6,2],[2,1,0,3,0],[3,2,0,3,1],[4,0,0,4,1],[5,0,0,3,1],[6,0,0,1,1]]],
  ["松树","物",0,[[0,4,0,2,2],[1,6,0,2,2],[2,7,0,1,3],[3,6,0,3,3],[4,0,0,2,3],[5,0,0,2,2],[6,0,1,2,2]]],
  ["鱼","兽",0,[[0,0,0,1,0],[1,4,0,3,2],[2,7,0,0,1],[3,0,0,4,0],[4,6,0,3,2],[5,0,0,3,0],[6,0,0,3,1]]],
  ["猫","兽",0,[[0,6,0,0,2],[1,6,0,0,4],[2,7,0,1,1],[3,2,0,2,3],[4,0,0,3,3],[5,0,0,2,3],[6,0,0,0,2]]],
  ["狐狸","兽",0,[[0,6,0,0,2],[1,4,0,4,2],[2,5,0,2,2],[3,2,0,2,2],[4,0,0,3,2],[5,0,0,2,2],[6,0,0,0,2]]],
  ["天鹅","兽",0,[[0,2,0,2,0],[1,4,0,4,4],[2,5,0,2,4],[3,6,0,1,3],[4,6,0,4,3],[5,0,0,4,3],[6,2,1,2,3]]],
  ["鸭子","兽",0,[[0,2,0,2,0],[1,6,0,1,3],[2,5,0,3,3],[3,2,0,2,3],[4,0,0,3,3],[5,0,0,2,3],[6,0,1,5,2]]],
  ["骆驼","兽",0,[[0,4,0,2,2],[1,6,0,2,2],[2,1,0,5,0],[3,0,0,0,1],[4,2,0,5,1],[5,0,0,5,1],[6,0,0,3,1]]],
  ["猫头鹰","兽",0,[[0,6,0,0,2],[1,4,0,4,2],[2,5,0,2,2],[3,0,0,2,2],[4,2,0,2,3],[5,0,0,1,2],[6,2,0,3,2]]],
  ["鹤","兽",0,[[0,2,0,2,0],[1,6,0,1,3],[2,5,0,2,4],[3,6,0,1,4],[4,4,0,3,4],[5,0,0,1,4],[6,0,0,2,2]]],
  ["飞鸟","兽",0,[[0,6,0,0,2],[1,4,0,6,2],[2,5,0,2,3],[3,6,0,1,3],[4,4,0,4,3],[5,0,0,4,2],[6,0,1,4,2]]],
  ["楼梯","人",0,[[0,0,0,0,1],[1,4,0,2,3],[2,1,0,3,3],[3,0,0,2,2],[4,2,0,4,3],[5,0,0,0,0],[6,2,0,3,2]]],
  ["站立的人","人",0,[[0,0,0,0,1],[1,4,0,2,3],[2,7,0,2,2],[3,0,0,2,1],[4,0,0,0,3],[5,0,0,1,0],[6,2,1,3,4]]],
  ["迈步的人","人",0,[[0,0,0,1,1],[1,4,0,3,3],[2,7,0,0,3],[3,6,0,0,4],[4,6,0,3,4],[5,0,0,1,0],[6,2,1,4,4]]]];
const R2 = Math.SQRT2;
const BASE = [[[0, 0], [2, 0], [0, 2]], [[0, 0], [2, 0], [0, 2]], [[0, 0], [R2, 0], [0, R2]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [1, 0], [2, 1], [1, 1]]];
const CLS = [0, 0, 1, 2, 2, 3, 4];
const PCOL = ['#c23a2b', '#2f5d8a', '#d9a12b', '#3f8f5b', '#7a4a9a', '#d9822b', '#3a9aa0'];
const cen = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const BC = BASE.map(cen);
/* polygon of piece p with rotation angle (radians), flip scale fx (1 or -1, may be fractional while animating), centroid (cx,cy) */
function polyAt(p, ang, fx, cx, cy) {
  const c = Math.cos(ang), s = Math.sin(ang), [bx, by] = BC[p];
  return BASE[p].map(([a, b]) => { a = (a - bx) * fx; b = b - by; return [a * c - b * s + cx, a * s + b * c + cy]; });
}
function rawPoly(p, k, f, x, y) { const c = Math.cos(k * Math.PI / 4), s = Math.sin(k * Math.PI / 4); return BASE[p].map(([a, b]) => { if (f) a = -a; return [a * c - b * s + x, a * s + b * c + y]; }); }
/* build normalized slots for a puzzle */
const PCACHE = {};
function puzzle(i) {
  if (PCACHE[i]) return PCACHE[i];
  const [name, cat, rot, sol] = PUZ[i], cr = Math.cos(rot * Math.PI / 4), sr = Math.sin(rot * Math.PI / 4);
  let slots = sol.map(([p, k, f, x, y]) => ({p, cls: CLS[p], k: (k + rot) % 8, f, v: rawPoly(p, k + rot, f, x * cr - y * sr, x * sr + y * cr)}));
  const all = slots.flatMap(s => s.v), mx = Math.min(...all.map(v => v[0])), my = Math.min(...all.map(v => v[1]));
  slots.forEach(s => { s.v = s.v.map(([a, b]) => [a - mx, b - my]); s.c = cen(s.v); });
  const W = Math.max(...all.map(v => v[0])) - mx, H = Math.max(...all.map(v => v[1])) - my;
  return PCACHE[i] = {name, cat, slots, W, H};
}
function pathPoly(g, pts, ox, oy, u) { g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(ox + a * u, oy + b * u) : g.moveTo(ox + a * u, oy + b * u)); g.closePath(); }
function drawSil(g, P, ox, oy, u, col) { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(1, u * .02); g.lineJoin = 'round'; for (const s of P.slots) { pathPoly(g, s.v, ox, oy, u); g.fill(); g.stroke(); } }
function drawPieceShape(g, pts, col, u, o = {}) {
  const c = cen(pts);
  g.save();
  if (o.lift) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = u * .3; g.shadowOffsetY = u * .14; }
  else { g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = u * .08; g.shadowOffsetY = u * .03; }
  g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath();
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const gr = g.createLinearGradient(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  gr.addColorStop(0, D.shade(col, 22)); gr.addColorStop(.55, col); gr.addColorStop(1, D.shade(col, -22));
  g.fillStyle = gr; g.fill(); g.restore();
  g.lineJoin = 'round'; g.lineWidth = Math.max(1, u * .035); g.strokeStyle = D.shade(col, -40); g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.stroke();
  // inner bevel highlight
  const sh = pts.map(([a, b]) => [c[0] + (a - c[0]) * .82, c[1] + (b - c[1]) * .82]);
  g.lineWidth = Math.max(1, u * .03); g.strokeStyle = 'rgba(255,240,215,.35)'; g.beginPath(); sh.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.stroke();
  if (o.sel) { g.lineWidth = Math.max(2, u * .06); g.strokeStyle = '#ffe08a'; g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.stroke(); }
  if (o.glow) { g.save(); g.shadowColor = '#fff2b0'; g.shadowBlur = u * .4; g.lineWidth = Math.max(2, u * .07); g.strokeStyle = `rgba(255,236,150,${o.glow})`; g.stroke(); g.restore(); }
}
const CATN = {'形': '几何', '字': '文字', '物': '器物', '兽': '鸟兽', '人': '人物'};

BX.register({
  id: 'tangram', title: '七巧板', cat: 'solo', order: 5, sub: '七块板拼万物',
  desc: '中国古老的拼板游戏。用两大、一中、两小五块三角形，加一块正方形和一块平行四边形，拼出 35 幅剪影：几何、文字、器物、鸟兽与人物。',
  kind: 'solo',
  rules: `<p>七巧板由 7 块组成：<b>大三角形 2 块、中三角形 1 块、小三角形 2 块、正方形 1 块、平行四边形 1 块</b>。每幅题目都恰好用全部 7 块拼成，块与块不能重叠。</p>
<p><b>操作</b>：拖动木板移动；<b>轻点</b>一块板使其顺时针旋转 45°；<b>双击平行四边形</b>（或点底部「翻转」）把它翻面。也可以先点选一块，再用底部「旋转」「翻转」按钮。键盘：R 旋转、F 翻转、Z 撤销、H 提示。</p>
<p>木板靠近正确位置且角度正确时会<b>自动吸附</b>到位；当剪影被完整覆盖、没有多出的部分时即告完成（另有拼法也算）。</p>
<p>「提示」会高亮一块板的正确位置，再按一次直接替你放好。「图谱」选择题目，已完成的题目会打勾并记录最快用时。</p>`,
  icon(g, w, h) {
    D.paper(g, 0, 0, w, h, {color: '#efe2c4'});
    const P = puzzle(PUZ.findIndex(p => p[0] === '狐狸')), u = Math.min(w * .8 / P.W, h * .8 / P.H), ox = (w - P.W * u) / 2, oy = (h - P.H * u) / 2;
    P.slots.forEach(s => drawPieceShape(g, s.v.map(([a, b]) => [ox + a * u, oy + b * u]), PCOL[s.p], u));
    K.seal(g, w * .88, h * .18, h * .2, '巧');
  },
  create(ctx) {
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let pi = BX.clamp(ctx.load('cur', 0), 0, PUZ.length - 1);
    let P, pcs, order, sel = -1, drag = null, undoS = [], time = 0, moves = 0, started = false, won = false, hintSt = null, hints = 0, winT = 0, L = null, pendTap = null;
    const done = () => ctx.load('done', {});
    const bar = K.bar(ctx, [
      {k: 'undo', ic: '↶', t: '撤销', on: () => undo()},
      {k: 'rot', ic: '⟳', t: '旋转', on: () => { if (sel >= 0) act(() => rotate(sel)); else ctx.toast('先点选一块板'); }},
      {k: 'flip', ic: '⇋', t: '翻转', on: () => { sel = 6; bring(6); act(() => flip(6)); }},
      {k: 'hint', ic: '☞', t: '提示', on: () => hint()},
      {k: 'pick', ic: '▦', t: '图谱', on: () => pick()},
    ]);
    function load(i) {
      pi = i; ctx.save('cur', i); P = puzzle(i);
      pcs = BASE.map((_, p) => ({p, k: p === 2 ? 1 : 0, f: 0, cx: 0, cy: 0, home: true, snap: -1, v: {cx: null, cy: null, ang: p === 2 ? Math.PI / 4 : 0, fx: 1}, ka: p === 2 ? 1 : 0}));
      order = BX.range(7); undoS = []; time = 0; moves = 0; started = false; won = false; hintSt = null; hints = 0; sel = -1; winT = 0; L = null;
      ctx.sfx('shuffle');
    }
    load(pi);
    function pick() {
      const dn = done();
      K.picker(ctx, '七巧图谱', PUZ.map((q, i) => ({
        label: q[0], sub: dn[i] != null ? '最快 ' + K.fmt(dn[i]) : CATN[q[1]], done: dn[i] != null, cur: i === pi,
        draw(g, w, h) { const Q = puzzle(i), u = Math.min(w * .86 / Q.W, h * .86 / Q.H); drawSil(g, Q, (w - Q.W * u) / 2, (h - Q.H * u) / 2, u, dn[i] != null ? '#3f7f6b' : '#2b2118'); },
      })), i => load(i));
    }
    /* ---------- geometry of pieces ---------- */
    const angOf = pc => pc.ka * Math.PI / 4;
    const polyOf = pc => polyAt(pc.p, angOf(pc), pc.f ? -1 : 1, pc.cx, pc.cy);
    function trySnap(i) {
      const pc = pcs[i]; pc.snap = -1;
      const pv = polyOf(pc), c = [pc.cx, pc.cy];
      const rel = pv.map(([a, b]) => [a - c[0], b - c[1]]);
      let best = -1, bd = .55;
      P.slots.forEach((s, j) => {
        if (s.cls !== CLS[pc.p] || pcs.some((q, qi) => qi !== i && q.snap === j)) return;
        const d = Math.hypot(s.c[0] - c[0], s.c[1] - c[1]); if (d >= bd) return;
        const sr = s.v.map(([a, b]) => [a - s.c[0], b - s.c[1]]);
        if (rel.every(([a, b]) => sr.some(([x, y]) => Math.abs(x - a) < .03 && Math.abs(y - b) < .03))) { best = j; bd = d; }
      });
      if (best >= 0) { pc.cx = P.slots[best].c[0]; pc.cy = P.slots[best].c[1]; pc.snap = best; pc.home = false; ctx.sfx('place'); return true; }
      return false;
    }
    const snapState = () => JSON.stringify(pcs.map(q => [q.k, q.ka, q.f, q.cx, q.cy, q.home, q.snap]));
    function act(fn) { const s = snapState(); if (fn() !== false) { undoS.push(s); if (undoS.length > 400) undoS.shift(); moves++; started = true; afterAct(); } }
    function undo() {
      if (!undoS.length || won) { ctx.sfx('error'); return; }
      JSON.parse(undoS.pop()).forEach((a, i) => { const q = pcs[i]; [q.k, q.ka, q.f, q.cx, q.cy, q.home, q.snap] = a; });
      ctx.sfx('whoosh'); hintSt = null;
    }
    function rotate(i) { const pc = pcs[i]; pc.k = (pc.k + 1) % 8; pc.ka++; if (!pc.home) trySnap(i); ctx.sfx(pc.snap >= 0 ? 'place' : 'tick'); if (pc.home) { pc.home = false; pc.hx = pc.cx; } }
    function flip(i) { const pc = pcs[i]; pc.f ^= 1; ctx.sfx('flip'); if (pc.home) pc.home = false; trySnap(i); }
    function afterAct() { hintSt = hintSt && pcs[hintSt.i].snap === hintSt.s ? null : hintSt; checkWin(); }
    /* coverage test with an offscreen raster */
    const off = document.createElement('canvas'); off.width = off.height = 120; const og = off.getContext('2d', {willReadFrequently: true});
    function coverage() {
      const m = .6, S = Math.max(P.W, P.H) + 2 * m, u = 120 / S;
      og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, 120, 120);
      og.globalCompositeOperation = 'source-over'; og.fillStyle = '#f00';
      for (const s of P.slots) { pathPoly(og, s.v, m * u, m * u, u); og.fill(); }
      const A = og.getImageData(0, 0, 120, 120).data;
      og.clearRect(0, 0, 120, 120); og.fillStyle = '#0f0';
      let outside = 0;
      for (const pc of pcs) { const pv = polyOf(pc); if (pv.some(([a, b]) => a < -m || b < -m || a > P.W + m || b > P.H + m)) outside++; pathPoly(og, pv, m * u, m * u, u); og.fill(); }
      if (outside) return 0;
      const B = og.getImageData(0, 0, 120, 120).data;
      let a = 0, ab = 0, b = 0;
      for (let k = 3; k < A.length; k += 4) { const ia = A[k] > 128, ib = B[k] > 128; if (ia) a++; if (ib) b++; if (ia && ib) ab++; }
      return Math.min(ab / a, ab / Math.max(1, b));
    }
    function checkWin() {
      if (won) return;
      const all = pcs.every(q => q.snap >= 0);
      if (!all && coverage() < .965) return;
      won = true; sel = -1; hintSt = null; winT = 0;
      const secs = Math.floor(time), dn = done(), old = dn[pi];
      if (old == null || secs < old) { dn[pi] = secs; if (!BX.test) ctx.save('done', dn); }
      ctx.best('t_' + pi, secs, 'min');
      // next unsolved puzzle becomes current (so 再来一局 opens it)
      let nx = pi; for (let k = 1; k <= PUZ.length; k++) { const j = (pi + k) % PUZ.length; if (dn[j] == null) { nx = j; break; } if (k === PUZ.length) nx = (pi + 1) % PUZ.length; }
      ctx.save('cur', nx);
      ctx.sfx('gong'); ctx.after(500, () => { fx.rain(cv.w, cv.h, 60); ctx.sfx('win'); });
      const nd = Object.keys(dn).length;
      ctx.end({win: true, title: '巧夺天工', text: `「${P.name}」 用时 ${K.fmt(secs)} 步数 ${moves}` + (hints ? ` · 提示 ${hints} 次` : '') + (old == null || secs < old ? ' · 新纪录！' : '') + ` · 图谱 ${nd}/${PUZ.length}`, delay: 2200});
    }
    function hint() {
      if (won) return;
      if (hintSt && pcs[hintSt.i].snap !== hintSt.s) {   // second press: place it
        const pc = pcs[hintSt.i], s = P.slots[hintSt.s];
        act(() => { pc.k = s.k; pc.f = s.f; pc.ka = pc.ka + (((s.k - pc.ka) % 8) + 8) % 8; pc.cx = s.c[0]; pc.cy = s.c[1]; pc.home = false; trySnap(hintSt.i); if (pc.snap < 0) { pc.cx = s.c[0]; pc.cy = s.c[1]; pc.snap = hintSt.s; } });
        bring(hintSt.i); hintSt = null; return;
      }
      // pick an empty slot (largest first) and a free piece of that class
      const free = P.slots.map((s, j) => j).filter(j => !pcs.some(q => q.snap === j)).sort((a, b) => P.slots[a].p - P.slots[b].p);
      for (const j of free) {
        const i = pcs.findIndex(q => q.snap < 0 && CLS[q.p] === P.slots[j].cls);
        if (i >= 0) { hintSt = {i, s: j, t: 0}; hints++; sel = i; ctx.sfx('tick'); ctx.toast('发光的位置就是这块板的去处，再按一次提示直接放好'); return; }
      }
    }
    const bring = i => { order.splice(order.indexOf(i), 1); order.push(i); };

    /* ---------- layout ---------- */
    function layout() {
      const A = bar.area(cv.w, cv.h), land = A.w > A.h * 1.05, pad = 10;
      const bw = land ? A.w * .56 : A.w, bh = land ? A.h : A.h * .56;
      const tx0 = land ? A.x + bw : A.x, ty0 = land ? A.y : A.y + bh, tw = land ? A.w - bw : A.w, th = land ? A.h : A.h - bh;
      // tray layout in units (shelf packing) for given width in units
      const items = [[0, 2, 2], [1, 2, 2], [2, 2, 1.1], [6, 2, 1.1], [5, 1.1, 1.1], [3, 1.1, 1.1], [4, 1.1, 1.1]];
      const pack = Wu => { let x = 0, y = 0, rh = 0; const pos = {}; for (const [p, w, hh] of items) { if (x + w > Wu && x > 0) { x = 0; y += rh + .35; rh = 0; } pos[p] = [x + w / 2, y + hh / 2]; x += w + .35; rh = Math.max(rh, hh); } return {pos, H: y + rh, W: Wu}; };
      let u = Math.min((bw - 2 * pad) / (P.W + 1.2), (bh - 2 * pad - 26) / (P.H + 1.2), 90), tray;
      for (let it = 0; it < 40; it++) {
        const Wu = Math.max(4.6, (tw - 2 * pad) / u); tray = pack(Wu);
        const realW = Math.max(...Object.entries(tray.pos).map(([p, [x]]) => x + 1.1));
        if (tray.H * u <= th - 2 * pad && realW * u <= tw - 2 * pad + 1) break;
        u *= .94;
      }
      const ox = A.x + (bw - P.W * u) / 2, oy = A.y + 26 + (bh - 26 - P.H * u) / 2;
      const realW = Math.max(...Object.entries(tray.pos).map(([p, [x]]) => x + 1.1));
      const tox = tx0 + (tw - realW * u) / 2, toy = ty0 + (th - tray.H * u) / 2;
      L = {u, ox, oy, land, bw, bh, A, tray: {x: tx0, y: ty0, w: tw, h: th}, home: p => [(tox - ox) / u + tray.pos[p][0], (toy - oy) / u + tray.pos[p][1]]};
      pcs.forEach(pc => { if (pc.home) { const [hx, hy] = L.home(pc.p); pc.cx = hx; pc.cy = hy; } else { pc.cx = BX.clamp(pc.cx, (A.x - ox) / u + .3, (A.x + A.w - ox) / u - .3); pc.cy = BX.clamp(pc.cy, (A.y - oy) / u + .3, (A.y + A.h - oy) / u - .3); } });
    }
    const toW = p => [(p.x - L.ox) / L.u, (p.y - L.oy) / L.u];
    function inPoly([x, y], pl) { let c = false; for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) { const [xi, yi] = pl[i], [xj, yj] = pl[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
    function pieceAt(p) {
      const w = toW(p);
      for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; if (inPoly(w, polyOf(pcs[i]))) return i; }
      // generous touch: nearest centroid within .45 units
      let best = -1, bd = BX.TOUCH.matches ? .5 : .25; for (const i of order) { const d = Math.hypot(pcs[i].cx - w[0], pcs[i].cy - w[1]); if (d < bd) { bd = d; best = i; } }
      return best;
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (won || !L || drag) return;
      const p = cv.pos(e), i = pieceAt(p);
      if (i < 0) { sel = -1; return; }
      const w = toW(p); bring(i); sel = i;
      drag = {i, sx: p.x, sy: p.y, dx: w[0] - pcs[i].cx, dy: w[1] - pcs[i].cy, moved: false, pid: e.pointerId, before: snapState(), mouse: e.pointerType === 'mouse'};
      try { cv.cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const p = cv.pos(e);
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > (drag.mouse ? 4 : 8)) { drag.moved = true; const pc = pcs[drag.i]; pc.snap = -1; pc.home = false; }
      if (!drag.moved) return;
      const w = toW(p), pc = pcs[drag.i]; pc.cx = w[0] - drag.dx; pc.cy = w[1] - drag.dy; pc.v.cx = pc.cx; pc.v.cy = pc.cy;
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      if (won) return;
      if (d.moved) {
        undoS.push(d.before); moves++; started = true;
        if (!trySnap(d.i)) ctx.sfx('tick');
        afterAct(); return;
      }
      // tap: rotate, or double tap on the parallelogram: flip
      if (d.i === 6) {
        if (pendTap && performance.now() - pendTap.t < 300) { ctx.cancel(pendTap.tm); pendTap = null; act(() => flip(6)); return; }
        pendTap = {t: performance.now(), tm: ctx.after(290, () => { pendTap = null; act(() => rotate(6)); })};
        return;
      }
      act(() => rotate(d.i));
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);

    /* ---------- drawing ---------- */
    let bgC = null, bgKey = '';
    return {
      frame(dt) {
        const g = cv.g; cv.clear(); layout();
        if (started && !won) time += dt;
        const key = cv.w + 'x' + cv.h + cv.dpr;
        if (key !== bgKey) { bgKey = key; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'wood'); }
        g.drawImage(bgC, 0, 0, cv.w, cv.h);
        const {u, ox, oy, A} = L;
        // paper scroll behind silhouette
        const px = L.land ? A.x + 8 : A.x + 8, py = A.y + 6, pw = (L.land ? L.bw : A.w) - 16, ph = (L.land ? A.h : L.bh) - 10;
        g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = '#efe2c4'; D.rr(g, px, py, pw, ph, 10); g.fill(); g.restore();
        D.paper(g, px, py, pw, ph, {r: 10, color: '#f3e8cf'});
        g.strokeStyle = 'rgba(178,58,43,.5)'; g.lineWidth = 1.5; D.rr(g, px + 5, py + 5, pw - 10, ph - 10, 7); g.stroke();
        const dn = done();
        D.text(g, `${pi + 1}. ${P.name}`, px + 16, py + 20, {size: 17, color: '#2b2118', font: 'serif', weight: 800, align: 'left'});
        D.text(g, `${K.fmt(time)} · 步数 ${moves}`, px + pw - 14, py + 20, {size: 13, color: '#8c7a63', weight: 700, align: 'right'});
        if (dn[pi] != null) K.seal(g, px + pw - 22, py + ph - 22, 26, '成', .1);
        // silhouette
        if (won) { winT += dt; }
        drawSil(g, P, ox, oy, u, won ? `rgba(200,160,82,${Math.min(1, winT * 2)})` : '#2b2118');
        if (!won) { g.save(); g.globalAlpha = .07; drawSil(g, P, ox + 3, oy + 4, u, '#000'); g.restore(); }
        // hint slot
        if (hintSt) {
          hintSt.t += dt; const s = P.slots[hintSt.s], a = .5 + .5 * Math.sin(hintSt.t * 7);
          g.save(); pathPoly(g, s.v, ox, oy, u); g.fillStyle = D.alpha(PCOL[pcs[hintSt.i].p], .35 + .3 * a); g.fill();
          g.setLineDash([6, 4]); g.lineWidth = 2.5; g.strokeStyle = `rgba(255,236,150,${.6 + .4 * a})`; g.stroke(); g.restore();
        }
        // pieces
        const kk = 1 - Math.exp(-dt * 16);
        for (const i of order) {
          const pc = pcs[i], v = pc.v;
          if (v.cx == null) { v.cx = (A.x + A.w / 2 - ox) / u; v.cy = (A.y + A.h / 2 - oy) / u; }
          if (!(drag && drag.i === i && drag.moved)) { v.cx += (pc.cx - v.cx) * kk; v.cy += (pc.cy - v.cy) * kk; }
          v.ang += (angOf(pc) - v.ang) * Math.min(1, kk * 1.3); v.fx += ((pc.f ? -1 : 1) - v.fx) * Math.min(1, kk * 1.2);
          const pp = polyAt(pc.p, v.ang, Math.abs(v.fx) < .05 ? .05 : v.fx, 0, 0).map(([a, b]) => [ox + (v.cx + a) * u, oy + (v.cy + b) * u]);
          const lift = drag && drag.i === i && drag.moved;
          drawPieceShape(g, pp, PCOL[pc.p], u, {lift, sel: sel === i && !won && !lift, glow: hintSt && hintSt.i === i ? .5 + .5 * Math.sin(hintSt.t * 7) : won ? Math.max(0, 1 - winT) : 0});
        }
        fx.draw(g, dt);
        if (!won) say(pcs.every(q => q.home) ? '拖动木板到剪影上 · 轻点旋转' : `已就位 ${pcs.filter(q => q.snap >= 0).length}/7 · 轻点旋转，双击平行四边形翻面`);
        bar.dis('undo', !undoS.length || won); bar.dis('rot', sel < 0 || won); bar.dis('flip', won); bar.dis('hint', won);
      },
      key(e) {
        if (won) return;
        if (e.code === 'KeyR' && sel >= 0) act(() => rotate(sel));
        if (e.code === 'KeyF') act(() => flip(6));
        if (e.code === 'KeyZ') undo();
        if (e.code === 'KeyH') hint();
      },
      debug: {
        get pi() { return pi; }, get L() { return L; }, get P() { return P; }, get pcs() { return pcs; }, load, count: PUZ.length,
        // screen position (client coords) of piece i's centroid and of slot j's centroid
        pieceXY(i) { const r = cv.cv.getBoundingClientRect(), pc = pcs[i]; return {x: r.left + L.ox + pc.cx * L.u, y: r.top + L.oy + pc.cy * L.u}; },
        slotXY(j) { const r = cv.cv.getBoundingClientRect(), s = P.slots[j]; return {x: r.left + L.ox + s.c[0] * L.u, y: r.top + L.oy + s.c[1] * L.u, k: s.k, f: s.f, p: s.p}; },
      },
    };
  },
});
