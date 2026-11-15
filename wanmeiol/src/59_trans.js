/* ================= 换地方的过场（RULES / OPTIMIZATIONS「过场」） =================
   点出口：黑幕淡入 → 地名浮出 → 在黑幕下换地方 → 淡出，约 1 秒。
   跨区域（石村 → 大荒 …）：远山一层层往后退，配一句路上的话，约 2.2 秒。
   自动寻路 / 地图点选：一张卡走完全程，小字随途经的地方变；跨区域那段换成远山。
   玉符传送：一圈光晕。
   点一下黑幕就跳过；设置里关掉动画就照旧瞬间到。联机时房主的过场会同步给队友。 */
const PTR_MS = { walk: [260, 440, 340], road: [380, 1300, 480], tp: [300, 900, 420], step: 430 };
const PTR_ROAD = {
  shicun: ['炊烟越来越近，能听见孩子们在村口喊。', '山路走熟了，脚自己就认得回家的方向。'],
  dahuang: ['山风里有兽吼，一声比一声远。', '古木遮天，太阳只漏下来几点。'],
  xushen: ['眼前一黑一亮，神魂轻得像一片羽毛。'],
  butian: ['云海翻上山门，钟声一下一下落进雾里。'],
  baiduan: ['断崖一座接一座，像被谁一刀刀劈开。'],
  shiguo: ['官道宽了，车马多了，城墙在天边露出一线。'],
  huoguo: ['空气烫起来，地面的石头都是红的。'],
  yiyu: ['天色变了，连风的味道都不一样。'],
  xianyu: ['仙光落在肩上，凉凉的，像露水。'],
  diluo: ['四周的光阴很乱，走一步，像过了一年。'],
  jiehai: ['脚下是看不见底的海，浪声从很远的地方传来。'],
  sanqian: ['界碑一块接一块，路的尽头是新的天地。'],
  xiangu: ['古地封了太久，连尘土都带着灵气。'],
  diguan: ['关墙高得看不见顶，墙上全是旧伤。'],
  jiutian: ['九天之上，风大得站不稳。'],
  baizu: ['边陲荒凉，走半天也碰不见一个人。'],
  shangjie: ['上界的天更高，灵气浓得像水。'] };
let ptrBusy = false, ptrSkip = false;
const ptrOn = () => animOn() && !(window.__dbg && !__dbg.trans);
const ptrK = () => ptrSkip ? 0 : SET.fast ? 0.55 : 1;
const ptrWait = (ms, stop) => new Promise(r => { const t0 = now(), tick = () => (ptrSkip || now() - t0 >= ms * ptrK() || (stop && stop())) ? r() : setTimeout(tick, 30); tick(); });
const ptrHalt = () => !ptrFree(); /* 剧情一开场就收幕，不挡对话 */
function ptrEl() { let e = $('ptr'); if (e) return e;
  e = el('div', ''); e.id = 'ptr'; e.innerHTML = '<canvas class="pt-hill"></canvas><div class="pt-ring"></div><div class="pt-box"><div class="pt-t"></div><div class="pt-s"></div><div class="pt-n"></div></div>';
  e.onclick = () => { if (NETROLE !== 'guest') ptrSkip = true; }; document.body.appendChild(e); return e; }
/* 三个原子操作：open / set / close —— 房主每做一步就广播给队友 */
function ptrApply(a, o) { const e = ptrEl();
  if (a === 'close') { e.classList.add('out'); e.classList.remove('show'); setTimeout(() => { if (e.classList.contains('out')) e.className = ''; }, 360); return; }
  if (a === 'open') { e.className = 'on'; void e.offsetWidth; e.classList.add('in'); }
  if (o.area) e.dataset.area = o.area;
  if (o.kind) { e.classList.remove('k-walk', 'k-road', 'k-tp'); e.classList.add('k-' + o.kind); if (o.kind === 'road') ptrHillRun(e); }
  if (o.tone) e.style.setProperty('--t0', o.tone[0]), e.style.setProperty('--t1', o.tone[1]), e.style.setProperty('--t2', o.tone[2]);
  if (o.t != null) e.querySelector('.pt-t').textContent = o.t; if (o.s != null) e.querySelector('.pt-s').textContent = o.s; if (o.n != null) e.querySelector('.pt-n').textContent = o.n;
  if (o.show) e.classList.add('show'); else if (o.show === false) e.classList.remove('show'); }
function ptrDo(a, o = {}) { ptrApply(a, o); if (NETROLE === 'host' && typeof netBroadcast === 'function') try { netBroadcast({ t: 'ptr', a, o }); } catch (e) { } }
function ptrInfo(to, kind) { const P = PLACES[to], A = AREAS[P.area] || AREAS.shicun;
  return { kind, area: P.area, tone: A.tone, t: P.name, s: A.name + (P.lv ? ` · ${P.lv[0]}-${P.lv[1]} 层` : '') + (isNight() ? ' · 夜' : ''), n: kind === 'road' ? pick(PTR_ROAD[P.area] || PTR_ROAD.dahuang) : kind === 'tp' ? '玉符一亮，眼前的景物像水面一样晃了晃。' : '' }; }
const ptrMove = (to, silent) => { go(to, silent); if (NETROLE === 'host' && typeof netSync === 'function') netSync(); }; /* 联机：每走一步都同步给队友 */
const ptrFree = () => !(STATE.battle || STATE.scene || STATE.dungeon || STATE.busy);
/* 一步：出口按钮 / 传送 */
async function ptrGo(to, kind) {
  if (ptrBusy || !PLACES[to] || !placeOpen(to)) return; if (!ptrOn() || !ptrFree()) return go(to);
  if (!kind) kind = PLACES[to].area !== PLACES[C.loc].area ? 'road' : 'walk'; const [a, b, c] = PTR_MS[kind];
  ptrBusy = true; ptrSkip = false; const o = ptrInfo(to, kind);
  try { ptrDo('open', { kind: o.kind, area: o.area, tone: o.tone, t: '', s: '', n: '' }); sfx(kind === 'tp' ? 'magic' : 'step'); await ptrWait(a);
    ptrMove(to); ptrDo('set', Object.assign(o, { show: true })); await ptrWait(b, ptrHalt); ptrDo('close'); await ptrWait(c); }
  finally { ptrBusy = false; ptrSkip = false; } }
function goT(to) { if (ptrBusy) return; if (!exitsOfHas(to)) return go(to); return ptrGo(to); }
const exitsOfHas = to => Object.values(exitsOf(C.loc)).includes(to);
/* 自动寻路：一张卡走完全程 */
{ const _aw = autoWalk; autoWalk = async function (to) {
  if (!ptrOn() || ptrBusy || !ptrFree() || !C || to === C.loc) return _aw(to); const path = route(C.loc, to); if (!path) { toast('那里还去不了'); return; }
  const id = walking = uid(); ptrBusy = true; ptrSkip = false; const D = PLACES[to], DA = AREAS[D.area] || AREAS.shicun;
  try { ptrDo('open', { kind: 'walk', area: D.area, tone: DA.tone, t: '前往 · ' + D.name, s: DA.name, n: '', show: true }); sfx('step'); await ptrWait(PTR_MS.walk[0]);
    for (let i = 1; i < path.length; i++) { const P = PLACES[path[i]], A = AREAS[P.area] || AREAS.shicun, cross = P.area !== PLACES[C.loc].area, last = i === path.length - 1;
      if (cross) { ptrDo('set', { kind: 'road', area: P.area, tone: A.tone, t: A.name, s: '前往 · ' + D.name, n: pick(PTR_ROAD[P.area] || PTR_ROAD.dahuang) }); sfx('step'); }
      else ptrDo('set', { kind: 'walk', area: P.area, tone: A.tone, t: last ? D.name : '前往 · ' + D.name, s: last ? ptrInfo(to, 'walk').s : '途经 · ' + P.name, n: '' });
      await ptrWait(cross ? PTR_MS.road[1] : PTR_MS.step); if (walking !== id || !ptrFree()) break; ptrMove(path[i], !last); if (!last) sfx('step'); }
    if (walking === id && C.loc === to) await ptrWait(PTR_MS.walk[1], ptrHalt); }
  finally { if (walking === id) walking = null; ptrDo('close'); ptrBusy = false; ptrSkip = false; } }; }
/* ---------- 赶路卡的远山：和地点画同一套水墨笔法（52_art.js 的 washHill / mistBand / pine） ----------
   三层山各画成一张能左右接上的长条（山脊首尾同高），远的慢、近的快地往后退；每个区域一种山形和一样标志：
   石村/大荒/补天阁 有松，百断山 断崖，石国 远处一线城墙，帝关 关墙，火国 地平线上的火光，界海 低伏的浪。 */
const PTR_HILL = { /* far / mid / near: [高度, 粗糙, 主峰数] */
  shicun: { far: [0.42, 0.5, 2], mid: [0.3, 0.48, 0], near: [0.16, 0.45, 0], tree: 5 },
  dahuang: { far: [0.62, 0.52, 3], mid: [0.4, 0.52, 1], near: [0.2, 0.5, 0], tree: 9 },
  butian: { far: [0.7, 0.42, 4], mid: [0.42, 0.46, 2], near: [0.18, 0.5, 0], tree: 4, mist: 0.5 },
  baiduan: { far: [0.66, 0.62, 3], mid: [0.48, 0.64, 2], near: [0.24, 0.6, 1] },
  shiguo: { far: [0.34, 0.45, 1], mid: [0.24, 0.45, 0], near: [0.12, 0.42, 0], wall: 'far', tree: 2 },
  huoguo: { far: [0.5, 0.56, 2], mid: [0.34, 0.58, 1], near: [0.18, 0.55, 0], glow: '#e0602a' },
  yiyu: { far: [0.62, 0.6, 3], mid: [0.42, 0.62, 2], near: [0.2, 0.6, 0] },
  diguan: { far: [0.5, 0.55, 2], mid: [0.3, 0.5, 0], near: [0.16, 0.5, 0], wall: 'mid' },
  jiehai: { far: [0.3, 0.38, 1], mid: [0.14, 0.34, 0], near: [0.08, 0.32, 0], mist: 0.45 },
  xianyu: { far: [0.62, 0.42, 3], mid: [0.36, 0.44, 1], near: [0.16, 0.46, 0], mist: 0.4 } };
const PTR_HILL0 = { far: [0.56, 0.5, 2], mid: [0.36, 0.5, 1], near: [0.18, 0.5, 0] };
function ptrCrest(seed, W, base, amp, rough, peaks) { /* 首尾同高的山脊线，长条可以无缝地接上 */
  const r = srng(seed), N = 128, h = new Array(N + 1); h[0] = h[N] = r() * 0.4; let d = 1;
  for (let st = N; st > 1; st >>= 1) { for (let i = st / 2; i < N; i += st) h[i] = (h[i - st / 2] + h[i + st / 2]) / 2 + (r() - 0.45) * d; d *= rough; }
  for (let p = 0; p < peaks; p++) { const c = N * (p + 0.3 + r() * 0.4) / peaks, w = 10 + r() * 14, k = 0.25 + r() * 0.35; for (let i = 0; i <= N; i++) { const dx = Math.min(Math.abs(i - c), N - Math.abs(i - c)); h[i] += k * Math.max(0, 1 - dx / w) ** 1.6; } }
  h[N] = h[0]; let lo = Math.min(...h), hi = Math.max(...h); if (hi - lo < 1e-6) hi = lo + 1; return h.map((v, i) => [i / N * W, base - amp * (v - lo) / (hi - lo)]); }
function ptrMist(g, W, y, h, col, a, seed) { /* 雾带：和 mistBand 一样，只是雾团在长条两头绕回来画，接缝处看不出断口 */
  const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, rgbA(col, 0)); gr.addColorStop(0.5, rgbA(col, a)); gr.addColorStop(1, rgbA(col, 0)); g.fillStyle = gr; g.fillRect(0, y - h, W, h * 2);
  const r = srng(seed); for (let i = 0; i < 6; i++) { const x = r() * W, rw = W * (0.08 + r() * 0.12), yy = y + (r() - 0.5) * h; for (const dx of [-W, 0, W]) { const cx = x + dx; if (cx + rw < 0 || cx - rw > W) continue;
    const rg = g.createRadialGradient(cx, yy, 0, cx, yy, rw); rg.addColorStop(0, rgbA(col, a * 0.7)); rg.addColorStop(1, rgbA(col, 0)); g.fillStyle = rg; g.save(); g.translate(cx, yy); g.scale(1, 0.28); g.translate(-cx, -yy); g.beginPath(); g.arc(cx, yy, rw, 0, TAU); g.fill(); g.restore(); } } }
const ptrHillCache = {};
function ptrHillTiles(area, H) { const key = area + ':' + H; if (ptrHillCache[key]) return ptrHillCache[key];
  for (const k in ptrHillCache) if (!k.endsWith(':' + H)) delete ptrHillCache[k];
  const A = AREAS[area] || AREAS.dahuang, T = A.tone, cf = PTR_HILL[area] || PTR_HILL0, W = Math.round(H * 2.8), out = [];
  const far = mixHex(T[1], T[2], 0.28), mid = mixHex(T[0], T[1], 0.55), near = mixHex(T[0], '#000000', 0.45), rim = T[2];
  [['far', far, 0.5, 0.6], ['mid', mid, 0.82, 0.8], ['near', near, 0.97, 0.98]].forEach(([L, col, top, base], li) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), [amp, rough, peaks] = cf[L], seed = 'ptr' + area + L;
    const pts = ptrCrest(seed, W, H * base, H * amp, rough, peaks);
    if (li === 0 && cf.glow) { const gl = g.createLinearGradient(0, H * 0.2, 0, H); gl.addColorStop(0, rgbA(cf.glow, 0)); gl.addColorStop(0.7, rgbA(cf.glow, 0.22)); gl.addColorStop(1, rgbA(cf.glow, 0.05)); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
    if (cf.wall === L) { const r = srng(seed + 'w'), x0 = W * (0.12 + r() * 0.15), x1 = x0 + W * 0.5, wh = H * (L === 'far' ? 0.045 : 0.13), y = H * base - H * amp * 0.28, nw = Math.max(3, wh * 0.35);
      const wc = mixHex(col, rim, 0.1), wg = g.createLinearGradient(0, y - wh * 2, 0, y + wh * 1.2); wg.addColorStop(0, rgbA(wc, 0.95)); wg.addColorStop(0.6, rgbA(wc, 0.85)); wg.addColorStop(1, rgbA(wc, 0)); g.fillStyle = wg; g.beginPath(); g.moveTo(x0, y + wh * 1.2); g.lineTo(x0, y - wh); /* 城墙：画在这一层山的后面，墙脚淡进雾里；平的一段，垛口一凹一凸，中间一座门楼 */
      for (let x = x0, k = 0; x < x1; x += nw, k++) { const yy = y - wh - (k % 2 ? 0 : nw * 0.7); g.lineTo(x, yy); g.lineTo(Math.min(x1, x + nw), yy); }
      const gx = (x0 + x1) / 2, tw = wh * 2.2, th = wh * 1.6; g.lineTo(x1, y - wh); g.lineTo(x1, y + wh * 1.2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(gx - tw * 0.5, y - wh); g.lineTo(gx - tw * 0.5, y - wh - th * 0.6); g.lineTo(gx - tw * 0.75, y - wh - th * 0.62); g.quadraticCurveTo(gx - tw * 0.3, y - wh - th * 0.75, gx, y - wh - th); g.quadraticCurveTo(gx + tw * 0.3, y - wh - th * 0.75, gx + tw * 0.75, y - wh - th * 0.62); g.lineTo(gx + tw * 0.5, y - wh - th * 0.6); g.lineTo(gx + tw * 0.5, y - wh); g.closePath(); g.fill();
      g.strokeStyle = rgbA(rim, 0.18); g.lineWidth = Math.max(1, H / 300); g.beginPath(); g.moveTo(x0, y - wh); g.lineTo(x1, y - wh); g.stroke(); }
    washHill(g, W, H, pts, col, top, [0.18, 0.62, 0.95][li], li === 2 ? H : H * (base + 0.08), li === 0 ? 0.14 : 0.3, seed);
    g.strokeStyle = rgbA(rim, li === 0 ? 0.14 : 0.2); g.lineWidth = Math.max(1, H / 260); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1] + 1) : g.moveTo(p[0], p[1] + 1)); g.stroke(); /* 山脊一线微光，暗底上看得出轮廓 */
    if (li === 2 && cf.tree) { const r = srng(seed + 't'); for (let k = 0; k < cf.tree; k++) { const i = 6 + Math.floor(r() * 116), [x, y] = pts[i]; pine(g, x, y + H * 0.02, H * (0.14 + r() * 0.12), rgbA(near, 0.98), r, H > 200 ? 1 : 0); } }
    if (li < 2) ptrMist(g, W, H * (li === 0 ? base + 0.06 : base + 0.04), H * 0.11, T[1], cf.mist || 0.3, seed + 'm');
    out.push(cv); });
  return ptrHillCache[key] = out; }
let ptrHillOn = false;
function ptrHillRun(e) { if (ptrHillOn) return; ptrHillOn = true; const cv = e.querySelector('.pt-hill'), g = cv.getContext('2d'), t0 = now(), SPD = [0.035, 0.09, 0.2];
  const frame = () => { if (!e.classList.contains('on') || !e.classList.contains('k-road')) { ptrHillOn = false; return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (w && h) { if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const tiles = ptrHillTiles(e.dataset.area || 'dahuang', h), t = (now() - t0) / 1000; g.clearRect(0, 0, w, h);
      tiles.forEach((tl, i) => { const off = (t * SPD[i] * h) % tl.width; for (let x = -off; x < w; x += tl.width) g.drawImage(tl, Math.floor(x), 0); }); }
    requestAnimationFrame(frame); };
  frame(); }
