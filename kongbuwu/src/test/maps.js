// node test/maps.js [地图] [q] [p] — 鬼屋地图检查：摆设不压墙不重叠、路线走得通、陈歌够得着每个机关和柜子、机关贴着游客实际走的路线（p 打印路线）
const vm = require('vm'), fs = require('fs'); const src = __dirname + '/../';
const fakeCtx = new Proxy({}, { get: () => () => ({}) });
const ctx = { document: { createElement: () => ({ getContext: () => fakeCtx, width: 0, height: 0 }) }, window: {}, Math, console, PPL: { 陈歌: {} }, pplOf: () => ({}), rnd: Math.random, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
vm.createContext(ctx); for (const f of ['51_pix.js', '47_house.js', '48_hmaps.js']) vm.runInContext(fs.readFileSync(src + f, 'utf8').replace(/^const /gm, 'var ').replace(/^let /gm, 'var '), ctx);
const { HMAPS, hmBuild, hmField, TILE } = ctx; let bad = 0; const only = process.argv[2];
for (const id in HMAPS) { if (only && id !== only) continue; const M = hmBuild(id), D = M.D, w = M.w, h = M.h; const err = m => { bad++; console.log('  ✗ ' + id + ': ' + m); };
  for (const r of D.rows || []) ; const occ = {}; const mark = (x, y, c, what) => { const k = x + ',' + y; if (occ[k]) err(what + ' at ' + k + ' overlaps ' + occ[k][1]); occ[k] = [c, what]; };
  for (const e of M.ents) { for (let yy = e.y; yy < e.y + e.h; yy++) for (let xx = e.x; xx < e.x + e.w; xx++) { const t = M.t[yy * w + xx]; if (e.wall) { if (t !== 'wall') err('wall deco ' + e.spr + ' not on wall ' + xx + ',' + yy); continue; } if (t === 'wall' || t === 'void') err('deco ' + e.spr + ' on wall ' + xx + ',' + yy); mark(xx, yy, e.hide ? 'H' : (e.flat ? '_' : 'o'), e.spr); } }
  M.slots.forEach(s => { mark(s.x, s.y, String(s.n), 'slot' + s.n); if (M.vs[s.y * w + s.x]) err('slot ' + s.n + ' solid'); });
  M.staff.forEach((s, i) => { mark(s.x, s.y, 'S', 'staff' + i); if (M.hs[s.y * w + s.x]) err('staff solid'); });
  const R = M.route; R.forEach((r, i) => { if (M.vs[r[1] * w + r[0]]) err('route ' + i + ' solid ' + r); });
  for (let i = 1; i < R.length; i++) { const f = hmField(M, R[i][0], R[i][1], 'v'); if (f[R[i - 1][1] * w + R[i - 1][0]] < 0) err('route ' + (i - 1) + '→' + i + ' not connected'); }
  const hf = hmField(M, M.start[0], M.start[1], 'h'); M.slots.forEach(s => { if (hf[s.y * w + s.x] < 0) err('slot ' + s.n + ' unreachable for hero'); }); M.hides.forEach(e => { if (hf[e.y * w + e.x] < 0) err('hide unreachable ' + e.x + ',' + e.y); }); M.staff.forEach(s => { if (hf[s.y * w + s.x] < 0) err('staff unreachable'); });
  if (D.chase) { const c = D.chase; for (const k of ['start', 'boss', 'item']) if (c[k] && M.hs[c[k][1] * w + c[k][0]]) err('chase ' + k + ' solid'); if (c.item && hf[c.item[1] * w + c.item[0]] < 0 && hmField(M, c.start[0], c.start[1], 'h')[c.item[1] * w + c.item[0]] < 0) err('chase item unreachable'); }
  for (const t of new Set(M.t)) if (t !== 'wall' && !TILE[t]) err('unknown tile ' + t);
  if (process.argv[3] !== 'q') { console.log('== ' + id + ' ' + D.n + ' rooms=' + M.rooms.length); const rr = {}; R.forEach((r, i) => rr[r[0] + ',' + r[1]] = i === 0 ? 'E' : i === R.length - 1 ? 'X' : 'r');
    for (let y = 0; y < h; y++) { let s = ''; for (let x = 0; x < w; x++) { const k = x + ',' + y, t = M.t[y * w + x]; s += occ[k] ? occ[k][0] : rr[k] ? rr[k] : M.sec[y * w + x] ? '%' : t === 'wall' ? '#' : t === 'void' ? ' ' : M.vs[y * w + x] ? 'T' : '.'; } console.log(s); } } }
console.log(bad ? bad + ' problems' : 'maps ok');
/* 路线实际经过的格子：机关位要贴着它 */
const { hmNext } = ctx; for (const id in HMAPS) { if (only && id !== only) continue; const M = hmBuild(id), w = M.w; if (!M.slots.length) continue; const path = []; let [x, y] = M.route[0];
  for (let i = 1; i < M.route.length; i++) { const f = hmField(M, M.route[i][0], M.route[i][1], 'v'); let n = 0; while (n++ < 400) { path.push([x, y]); const nx = hmNext(M, f, x, y, 'v'); if (!nx) break; [x, y] = nx; } }
  const off = M.slots.map(s => [s.n, Math.min(...path.map(p => Math.max(Math.abs(p[0] - s.x), Math.abs(p[1] - s.y))))]).filter(q => q[1] > 1);
  console.log(id + ' path ' + path.length + ' tiles' + (off.length ? ' · slots off path: ' + off.map(q => q[0] + '(' + q[1] + ')').join(' ') : ' · slots ok'));
  if (process.argv[4] === 'p') { const ps = new Set(path.map(p => p + '')); for (let yy = 0; yy < M.h; yy++) { let s = ''; for (let xx = 0; xx < w; xx++) { const sl = M.slots.find(q => q.x === xx && q.y === yy); s += sl ? sl.n : ps.has(xx + ',' + yy) ? '*' : M.vs[yy * w + xx] ? (M.t[yy * w + xx] === 'wall' ? '#' : 'o') : '.'; } console.log(s); } } }
