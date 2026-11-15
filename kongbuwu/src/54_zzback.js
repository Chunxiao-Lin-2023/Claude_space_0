/* ================= 后台：柜子、黑布门帘、员工通道里跑、抄近路（第二十三轮，RULES 40） =================
   1. 柜子：点柜子身上任何地方都会走进去躲；附近有柜子时「吓！」那个键变成「🚪 躲进柜子」；离得近的柜子顶上有个淡淡的门形记号。
   2. 黑布门帘：员工通道被房间之间的过道切断的那几格挂黑布帘（M.cross）。陈歌和员工站在帘子里，游客只有贴到 1.6 格内才看得见；
      以前这里是明处，穿过员工通道时总在这几格被看见。
   3. 员工通道里跑：陈歌在通道里速度 ×HB.heroBack；点地面走路时按“时间最短”找路，自然会钻通道。
   4. 抄近路：点小地图上游客那一团，陈歌不去游客现在的位置，而是去他们前面路线上来得及赶到的柜子 / 暗口 / 门帘，先藏好等着。 */
HB.heroBack = 2.0;
function hBackMark(M) { const w = M.w, h = M.h, N = w * h; M.cross = new Uint8Array(N); if (!M.stw) return;
  const col = new Array(w).fill(0), row = new Array(h).fill(0); for (let i = 0; i < N; i++) if (M.stw[i]) { col[i % w]++; row[(i / w) | 0]++; }
  for (let i = 0; i < N; i++) { const x = i % w, y = (i / w) | 0, t = M.t[i]; if (M.stw[i] || t === 'wall' || t === 'void' || M.hs[i]) continue; if (col[x] >= h * .45 || row[y] >= w * .45) M.cross[i] = 1; } }
{ const _hb = hmBuild; hmBuild = function (id) { const M = _hb(id); if (M && !M.cross) hBackMark(M); return M; }; }
const hBackAt = (M, x, y) => { const i = Math.round(y) * M.w + Math.round(x); return !!(M.sec[i] || (M.cross && M.cross[i])); };
/* 门帘里：远处看不见 */
{ const _see = hSee; hSee = function (H, v) { const h = H.hero, M = H.M; if (M.cross && M.cross[Math.round(h.y) * M.w + Math.round(h.x)] && hDist(h, v) > 1.6) return false; return _see(H, v); }; }
{ const _ss = hStaffSeen; hStaffSeen = function (H, st) { const M = H.M; if (M.cross && M.cross[st.ty * M.w + st.tx]) return; return _ss(H, st); }; }
/* 通道里跑 */
{ const _st = hStepTo; hStepTo = function (a, nx, ny, spd) { const H = typeof HS !== 'undefined' ? HS : null; if (H && a === H.hero && H.M && hBackAt(H.M, a.tx, a.ty) && hBackAt(H.M, nx, ny)) spd *= HB.heroBack; return _st(a, nx, ny, spd); }; }
/* 陈歌找路：按时间算（通道里一格只算半格） */
function hmFieldH(M, tx, ty, nocache) { const key = 'H' + tx + ',' + ty; if (M.fields[key]) return M.fields[key]; const w = M.w, N = w * M.h, f = new Float32Array(N).fill(-1), done = new Uint8Array(N), hp = [[0, ty * w + tx]]; f[ty * w + tx] = 0;
  const push = (d, i) => { hp.push([d, i]); let c = hp.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (hp[p][0] <= hp[c][0]) break; [hp[p], hp[c]] = [hp[c], hp[p]]; c = p; } };
  const pop = () => { const top = hp[0], last = hp.pop(); if (hp.length) { hp[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < hp.length && hp[l][0] < hp[m][0]) m = l; if (r < hp.length && hp[r][0] < hp[m][0]) m = r; if (m === c) break; [hp[m], hp[c]] = [hp[c], hp[m]]; c = m; } } return top; };
  const back = i => M.sec[i] || (M.cross && M.cross[i]);
  while (hp.length) { const [d, c] = pop(); if (done[c]) continue; done[c] = 1; const cx = c % w, cy = (c / w) | 0; for (const [dx, dy] of HD) { const nx = cx + dx, ny = cy + dy, k = ny * w + nx; if (nx < 0 || ny < 0 || nx >= w || ny >= M.h || M.hs[k] || done[k]) continue; const nd = d + (back(k) && back(c) ? 1 / HB.heroBack : 1); if (f[k] < 0 || nd < f[k]) { f[k] = nd; push(nd, k); } } }
  if (nocache) return f; return M.fields[key] = f; }
/* 抄近路：去游客前面来得及赶到的藏身处 */
/* 游客在路线上的位置：路线会走进死胡同再折回来，只在他正走向的那一段里找 */
function hPathIdx(M, v) { const P = M.path, R = M.route; if (!M.pseg) { M.pseg = [0]; let k = 1; for (let j = 0; j < P.length && k < R.length; j++) if (P[j][0] === R[k][0] && P[j][1] === R[k][1]) { M.pseg[k] = j; k++; } while (M.pseg.length < R.length) M.pseg.push(P.length - 1); }
  const k = clamp(v.wi || 1, 1, R.length - 1), lo = M.pseg[k - 1], hi = M.pseg[k]; let vi = lo, bd = 1e9; for (let j = lo; j <= hi; j++) { const d = Math.hypot(P[j][0] - v.x, P[j][1] - v.y); if (d < bd - 1e-6) { bd = d; vi = j; } } return vi; }
function hAmbush(H, v) { const M = H.M, h = H.hero, P = M.path; if (!P || !P.length) return null; const vi = hPathIdx(M, v);
  const vs = Math.max(.6, HB.walk * ((v.u && v.u.spd) || 10) / 10), hs = HB.hero, cand = [];
  const add = (x, y, kind) => { if (hmSolid(M, M.hs, x, y) && kind !== 'hide') return; for (let i = vi + 4; i < Math.min(P.length, vi + 26); i++) { const d = Math.hypot(P[i][0] - x, P[i][1] - y); if (d <= (kind === 'hide' ? 2.6 : 2.1)) { cand.push({ x, y, kind, i }); return; } } };
  for (const e of M.hides) add(e.x, e.y, 'hide');
  for (let i = 0; i < M.w * M.h; i++) if ((M.cross && M.cross[i]) || (M.sec[i] && !M.stw[i])) add(i % M.w, (i / M.w) | 0, 'back');
  let best = null, bs = -1e9; const FH = hmFieldH(M, h.tx, h.ty, true); for (const c of cand) { if (H.staff.some(s => s.tx === c.x && s.ty === c.y)) continue; const f = FH[c.y * M.w + c.x]; if (f < 0) continue;
    const tH = f / hs, tV = (c.i - vi) / vs, slack = tV - tH - .8; const sc = (slack >= 0 ? 100 - (c.i - vi) * 2 : slack * 10) + (c.kind === 'hide' ? 6 : 0); if (sc > bs) { bs = sc; best = c; } }
  return best; }
function hsMmGo(H, x, y) { const h = H.hero; H.auto = false; const v = hActive(H).filter(q => !hOut(q) && q.st !== 'wait' && Math.hypot(q.x - x, q.y - y) < 4.5).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
  if (v) { const c = hAmbush(H, v); if (c) { hGo(H, c.x, c.y); H.focus = null; H.focusPt = null; hFloat(H, h.x, h.y - 1.6, c.kind === 'hide' ? '抄近路 → 柜子' : '抄近路', 'txt'); return c; } }
  hGo(H, x, y); return null; }
/* 点柜子身上任何地方 = 躲进去 */
{ const _tap = hsTap; hsTap = function (ev) { const H = HS; if (H && H.phase === 'live' && !H.done && !H.paused) { const [x, y] = hsPt(H, ev);
    const guest = hActive(H).some(q => Math.hypot(q.x - x, q.y - .5 - y) < 1); const e = !guest && H.M.hides.find(q => Math.abs(x - q.x) < .62 && y > q.y - 1.75 && y < q.y + .6);
    if (e) { H.auto = false; const h = H.hero; h.chase = null; if (h.tx === e.x && h.ty === e.y) { h.hidden = true; return; } hGo(H, e.x, e.y); sfx('tap'); hFloat(H, h.x, h.y - 1.6, '躲进去', 'txt'); return; } }
  return _tap(ev); }; }
/* 「吓！」键：没得吓的时候，附近有柜子就变成「躲进柜子」 */
function hHideNear(H, lim) { const h = H.hero, M = H.M; let best = null, bd = lim; for (const e of M.hides) { if (Math.hypot(e.x - h.x, e.y - h.y) > lim + 1) continue; const f = hmField(M, e.x, e.y, 'h')[h.ty * M.w + h.tx]; if (f >= 0 && f < bd) { bd = f; best = e; } } return best; }
{ const _ap = hsActPlan; hsActPlan = function (H) { const a = _ap(H); if (a || H.mode !== 'house') return a; const h = H.hero; if (h.hidden) return null; const e = hHideNear(H, 6); if (e) return { lab: '🚪 躲进柜子', f: () => { h.chase = null; hGo(H, e.x, e.y); } }; return null; }; }
/* 画：门帘（地图缓存里）、附近柜子的记号（黑暗上面） */
{ const _mc = hsMapCache; hsMapCache = function (M) { const had = !!M.cache, c = _mc(M); if (had || !M.cross) return c; const g = c.getContext('2d');
  for (let i = 0; i < M.w * M.h; i++) { if (!M.cross[i]) continue; const x = (i % M.w) * 16, y = ((i / M.w) | 0) * 16; g.fillStyle = 'rgba(6,4,8,.62)'; g.fillRect(x, y, 16, 16);
    const vert = M.stw[i - 1] || M.stw[i + 1] || (M.cross[i - 1] || M.cross[i + 1]); g.fillStyle = 'rgba(30,24,34,.9)'; for (let k = 0; k < 4; k++) vert ? g.fillRect(x + 1 + k * 4, y, 2, 15) : g.fillRect(x, y + 1 + k * 4, 15, 2); g.fillStyle = 'rgba(150,110,200,.25)'; vert ? g.fillRect(x, y, 16, 1) : g.fillRect(x, y, 1, 16); }
  return c; }; }
function hsBackDraw(H, g, ox, oy, t) { if (H.mode !== 'house' || H.phase !== 'live') return; const h = H.hero; if (h.hidden) return; const a = .3 + .2 * Math.sin(t * 3);
  for (const e of H.M.hides) { const d = Math.hypot(e.x - h.x, e.y - h.y); if (d > 7) continue; const x = Math.round(e.x * 16 - ox) + 5, y = Math.round(e.y * 16 - oy) - 30; g.globalAlpha = a * (1 - d / 8);
    g.fillStyle = '#e8dcc0'; g.fillRect(x, y, 6, 1); g.fillRect(x, y, 1, 8); g.fillRect(x + 5, y, 1, 8); g.fillRect(x, y + 7, 6, 1); g.fillRect(x + 3, y + 4, 1, 1); g.globalAlpha = 1; } }
