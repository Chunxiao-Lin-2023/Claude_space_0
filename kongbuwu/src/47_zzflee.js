/* ================= 游客：胆量、腿脚、逃跑、躲起来（第二十四轮，RULES 41） =================
   · 每个游客有胆量（胆小 ×0.62 / 普通 / 胆大 ×1.45 / 铁胆 ×1.95，乘 SAN）和腿脚（腿慢 ×0.8 / 普通 / 腿快 ×1.25，走和跑都乘），
     头上小标签写着（沉浸模式不写）；SAN 整体 ×HB.sanMul，晕过去平均要吓好几下。
   · 被吓到：定住 → 跑，越怕跑得越远越久；跑完怕得厉害的会找地方躲：前面路线旁的柜子（钻进去，柜门一直抖）
     或墙角（蹲下发抖），躲 4–9 秒，慢慢缓过来一点再出来接着走。
   · 找到躲着的人再吓一下 ×1.5（「找到你了」）；陈歌走到柜子边就是拉开柜门。躲着的人看不见陈歌。
   · 员工照旧会追正在跑 / 正去躲的人补吓。 */
Object.assign(HB, { sanMul: 1.7, mateSan: .55, groupSpan: 150, staffSan: .2, enterGap: 16, tMax: 520, cowerRec: .012, cowerCap: .18 });
const HNERVE = [['胆小', .62, 25], ['', 1, 43], ['胆大', 1.45, 22], ['铁胆', 1.95, 10]], HLEGS = [['腿慢', .8, 25], ['', 1, 50], ['腿快', 1.25, 25]];
const HCOWER = ['别找到我别找到我……', '呜……', '（捂着嘴不敢出声）', '我不玩了……', '它走了没有……'], HFOUND = ['找到你了！', '躲哪儿都没用'];
function hTemper(H) { const r = srng(((C && C.day) || 1) * 977 + H.o.scene.length * 131 + H.vis.length * 17); const pk = T => { let s = 0; const tot = T.reduce((a, b) => a + b[2], 0), x = r() * tot; for (const t of T) { s += t[2]; if (x < s) return t; } return T[1]; };
  /* 分批进门：按人数分 1–5 批，批与批之间隔开，整场大约 3–5 分钟 */ const N = H.vis.length, G = clamp(Math.round(N / 2.5), 1, 5), per = Math.ceil(N / G), gap = Math.max(HB.enterGap, Math.min(48, HB.groupSpan / G)), sk = 1 + HB.staffSan * Math.max(0, (H.staff || []).length - 1);
  if (!H.o.story && !H.rule) { const ord = []; for (const v of H.vis) if (!v.mate) { ord.push(v); for (const q of H.vis) if (q.mate === v) ord.push(q); } ord.forEach((v, i) => { v.at = Math.floor(i / per) * gap + (i % per) * 1.3 + .6; }); }
  for (const v of H.vis) { const u = v.u, n = u.boss ? ['', 1.15] : pk(HNERVE), l = u.boss ? ['', 1] : pk(HLEGS); v.nerve = n[1]; v.legs = l[1]; v.tmpTag = [n[0], l[0]].filter(Boolean).join('·');
    u.mhp = Math.max(1, Math.round(u.mhp * HB.sanMul * (H.o.story || H.rule ? .75 : 1) * sk * n[1] * (v.mate ? HB.mateSan : 1)));   /* 剧情接待少加一点，别卡剧情 */ u.hp = u.mhp; u.spd = (u.spd || 10) * l[1]; } }
/* 同伴不再是摆设：每个同伴都是一个自己会怕、会跑、会躲的游客，和带头的一起进门（剧情接待不拆） */
function hSplitGroups(H) { if (H.o.story || H.rule) return; const add = [];
  for (const v of H.vis) { if (v.u.boss || !v.fol.length) continue; v.fol.forEach((f, j) => { const u = Object.assign({}, v.u, { key: v.u.key + '_f' + j, n: v.u.n + '的同伴', st: {}, intent: null, charging: null, trait: '', boss: false });
      add.push(hActor(H.M.route[0][0], H.M.route[0][1], { u, P: f.P, st: 'wait', at: v.at + (j + 1) * 1.3, wi: 1, wait: 0, seeCd: 0, mockN: 0, ftrail: [], fol: [], bub: null, light: 1.8, tags: 0, mate: v })); }); v.fol = []; }
  H.vis.push(...add); for (const q of add) H.B.foes.push(q.u); }
{ const _hs = houseStart; houseStart = function (H) { const r = _hs(H); if (H.mode === 'house') { hSplitGroups(H); hTemper(H); } return r; }; }
/* 去哪儿躲：前面路线旁的空柜子（优先）或墙角 */
/* 从一个点出发的步数（不进缓存：游客位置每次都不一样，进缓存会把内存吃光） */
function hBfs(M, x0, y0, g) { const w = M.w, N = w * M.h, f = new Int16Array(N).fill(-1), q = new Int32Array(N); let a = 0, b = 0; f[y0 * w + x0] = 0; q[b++] = y0 * w + x0;
  while (a < b) { const c = q[a++], cx = c % w, cy = (c / w) | 0; for (const [dx, dy] of HD) { const nx = cx + dx, ny = cy + dy, k = ny * w + nx; if (nx < 0 || ny < 0 || nx >= w || ny >= M.h || g[k] || f[k] >= 0) continue; f[k] = f[c] + 1; q[b++] = k; } } return f; }
function hHideSpot(H, v) { const M = H.M, P = M.path; if (!P || !P.length || typeof hPathIdx !== 'function') return null; const vi = hPathIdx(M, v), F = hBfs(M, v.tx, v.ty, M.vs), fv = (x, y) => F[y * M.w + x];
  const busy = (x, y) => H.vis.some(q => q !== v && (q.hideAt && q.hideAt[0] === x && q.hideAt[1] === y)) || H.staff.some(s => hDist(s, { x, y }) < 2) || hDist(H.hero, { x, y }) < 2.5;
  const ahead = (x, y, r) => { for (let i = vi + 1; i < Math.min(P.length, vi + 22); i++) if (Math.hypot(P[i][0] - x, P[i][1] - y) <= r) return i; return -1; };
  let best = null, bs = 1e9;
  for (const e of M.hides) { if (e.occ || (H.hero.hidden && H.hero.tx === e.x && H.hero.ty === e.y)) continue; const i = ahead(e.x, e.y, 3); if (i < 0) continue; const a = HD.map(d => [e.x + d[0], e.y + d[1]]).filter(p => !hmSolid(M, M.vs, p[0], p[1]) && !M.sec[p[1] * M.w + p[0]]).sort((p, q) => fv(p[0], p[1]) - fv(q[0], q[1]))[0]; if (!a || fv(a[0], a[1]) < 0 || busy(e.x, e.y)) continue; const sc = (i - vi) * .8 + fv(a[0], a[1]) * .3; if (sc < bs) { bs = sc; best = { x: a[0], y: a[1], cl: e }; } }
  if (!best || bs > 10) for (let i = vi + 2; i < Math.min(P.length, vi + 16); i++) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = P[i][0] + dx, y = P[i][1] + dy; if (hmSolid(M, M.vs, x, y) || M.sec[y * M.w + x]) continue; let wn = 0; for (const d of HD) if (hmSolid(M, M.vs, x + d[0], y + d[1])) wn++; if (wn < 2 || busy(x, y)) continue; const f = fv(x, y); if (f < 0) continue; const sc = (i - vi) * .8 + f * .3 + 4; if (sc < bs) { bs = sc; best = { x, y, cl: null }; } }
  return best; }
/* 吓懵了在房间里乱跑：在这间屋里绕几个点（离吓他的东西越远越好），再去找往前走的门（第二十五轮） */
function hPanicPlan(H, v) { const M = H.M, r = hmRoomAt(M, v.x, v.y); if (!r || v.u.boss) return null; const F = hBfs(M, v.tx, v.ty, M.vs), blocks = M.rooms.filter(q => q.n === r.n), src = v.scSrc || H.hero, fear = 1 - v.u.hp / v.u.mhp;
  const k = clamp(Math.round(1 + fear * 2.4 + (v.nerve < .8 ? 1 : v.nerve > 1.6 ? -1 : 0)), 1, 4), pts = [];
  for (const b of blocks) for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * M.w + x; if (M.vs[i] || M.sec[i] || F[i] < 2 || F[i] > 6) continue; pts.push([x, y]); }
  if (pts.length < 4) return null; const out = []; let cur = [v.tx, v.ty];
  for (let n = 0; n < k; n++) { let best = null, bs = -1e9; for (const p of pts) { const d = Math.hypot(p[0] - cur[0], p[1] - cur[1]); if (d < 2.5 || out.some(o => Math.hypot(o[0] - p[0], o[1] - p[1]) < 2)) continue; const sc = Math.min(5, Math.hypot(p[0] - src.x, p[1] - src.y)) * 1.2 + Math.min(d, 5) * .5 + rnd() * 4;   /* 躲开吓他的东西，但在附近打转，不会一口气跑到屋子另一头 */ if (sc > bs) { bs = sc; best = p; } } if (!best) break; out.push(best); cur = best; }
  return out.length ? out : null; }
function hPanicTick(H, v, dt) { const M = H.M, p = v.pan[0]; if ((v.panWait || 0) > 0) { v.panWait -= dt; v.fr = 0; return; } if (v.tx === p[0] && v.ty === p[1]) { v.pan.shift(); v.panF = null; v.panWait = .35 + rnd() * .35; /* 撞到墙 / 回头看一眼，员工这时候追得上 */ if (!v.pan.length) { v.pan = null; const fear = Math.max(0, 1 - v.u.hp / v.u.mhp - .3); v.runN = 3 + Math.round(fear * 6); v.runEnd = H.t + 2.5; if (rnd() < .5) hBub(H, v, pick(['门！门在哪儿！', '这边！', '出口呢？！', '快走快走快走']), 1); } else if (rnd() < .35) hBub(H, v, pick(['啊啊啊——', '别过来！', '不是这边！', '救命！']), .9); return; }
  if (!v.panF) v.panF = hBfs(M, p[0], p[1], M.vs); const n = hmNext(M, v.panF, v.tx, v.ty, 'v'); if (!n) { v.pan = null; v.panF = null; return; } hStepTo(v, n[0], n[1], HB.run * .85 * (v.legs || 1)); }   /* 吓懵了跑不直，比顺路逃跑慢一点 */
function hCowerEnd(H, v, quiet) { const e = v.inCl; if (e) { e.occ = null; v.inCl = null; if (v.hideFrom) { v.x = v.tx = v.hideFrom[0]; v.y = v.ty = v.hideFrom[1]; } } v.hideAt = null; v.hideFrom = null; if (!quiet) { v.st = 'walk'; v.shaky = H.t + 3; } }
{ const _vt = hVisTick; hVisTick = function (H, v, dt) { const M = H.M, u = v.u;
  /* 收工 / 氛围拆完时被改成「出去」的：先从柜子里出来，否则卡在柜子里走不动 */ if ((v.inCl || v.hideAt) && v.st !== 'cower' && v.st !== 'tohide') hCowerEnd(H, v, true);
  if (v.st === 'leave' && v.wi > M.route.length + 1) { v.st = 'gone'; return; }
  const own = !v.mv && (v.st === 'tohide' || v.st === 'cower' || (v.st === 'run' && v.pan)); if (own) { v.seeCd -= dt; if (v.bub && v.bub.until < H.t) v.bub = null; hPaceTick(H, v, dt); }   /* 自己接管的几个状态也要做原来每帧的杂事（气泡过期等） */
  if (v.st === 'tohide' && !v.mv) { const T = v.hideAt; if (!T) { v.st = 'walk'; return; } const g = v.hideFrom || T;
    if (v.tx === g[0] && v.ty === g[1]) { v.st = 'cower'; H.stats.hid = (H.stats.hid || 0) + 1; if (v.cl) H.stats.hidCl = (H.stats.hidCl || 0) + 1; const fear = 1 - u.hp / u.mhp; v.wait = (4 + fear * 5) * (v.nerve < .8 ? 1.25 : v.nerve > 1.6 ? .7 : 1); v.cap = Math.min(u.mhp, u.hp + u.mhp * HB.cowerCap); v.pose = 'shake'; v.poseT = H.t; v.emo = { s: 'TT', until: H.t + v.wait };
      if (v.cl) { v.inCl = v.cl; v.cl.occ = v; v.x = v.tx = v.cl.x; v.y = v.ty = v.cl.y; sfx('creak'); hBub(H, v, '（钻进了柜子）', 1.4); } else hBub(H, v, pick(HCOWER), 1.6); return; }
    const n = hmNext(M, hmField(M, g[0], g[1], 'v'), v.tx, v.ty, 'v'); if (!n) { hCowerEnd(H, v); return; } hStepTo(v, n[0], n[1], HB.run * (v.legs || 1)); return; }
  if (v.st === 'cower') { v.wait -= dt; v.fr = 0; v.seeCd = Math.max(v.seeCd, .5); if (u.hp > 0 && u.hp < v.cap) u.hp = Math.min(v.cap, u.hp + u.mhp * HB.cowerRec * dt); if ((v.whimT = (v.whimT ?? 2) - dt) <= 0) { v.whimT = 2.5 + rnd() * 2; if (!v.bub) hBub(H, v, pick(HCOWER), 1.3); }
    if (v.wait <= 0) { hCowerEnd(H, v); hBub(H, v, pick(['……走了吧？', '快走快走', '我们出去吧']), 1.4); } return; }
  if (v.st === 'run' && v.pan && !v.mv) { if (H.t > v.panEnd) { v.pan = null; v.panF = null; } else { hPanicTick(H, v, dt); return; } }
  if (v.st !== 'run' && v.pan) { v.pan = null; v.panF = null; }
  const was = v.st; _vt(H, v, dt);
  if (H.mode !== 'house') return;
  if (was === 'react' && v.st === 'run') { const fear = Math.max(0, 1 - u.hp / u.mhp - .3); v.runN = Math.round((6 + fear * 13) * (fear > 0 ? v.legs || 1 : 1)); v.runEnd = H.t + HB.runT + fear * 3;
    const pl = hPanicPlan(H, v); if (pl) { v.pan = pl; v.panF = null; v.panEnd = H.t + 2 + pl.length * 2.2; v.runEnd = v.panEnd + 3; } }   /* 轻轻一吓照旧跑 6 格；吓狠了跑得远 */
  if (was === 'run' && v.st === 'walk' && !u.boss) { const fear = 1 - u.hp / u.mhp, p = .25 + fear * .7 + (v.nerve < .8 ? .2 : v.nerve > 1.6 ? -.25 : 0);
    if (fear >= .25 && rnd() < p) { const s = hHideSpot(H, v); if (s) { v.st = 'tohide'; v.hideAt = s.cl ? [s.cl.x, s.cl.y] : [s.x, s.y]; v.hideFrom = [s.x, s.y]; v.cl = s.cl; hBub(H, v, pick(['躲起来！', '那边，快！', '先藏一下……']), 1.2); } } } }; }
{ const _rx = hReact; hReact = function (H, v, src, hard) { if (v.st === 'cower' || v.st === 'tohide') hCowerEnd(H, v, true); if (src && src.x != null) v.scSrc = { x: src.x, y: src.y }; v.pan = null; v.panF = null; return _rx(H, v, src, hard); }; }
{ const _sc = hScared; hScared = function (H, v) { if (v.inCl || v.hideAt) hCowerEnd(H, v, true); return _sc(H, v); }; }
{ const _see = hSee; hSee = function (H, v) { if (v.st === 'cower' || v.st === 'tohide') return false; return _see(H, v); }; }
{ const _pc = hPace; hPace = function (H, v, kind, src, el) { let m = _pc(H, v, kind, src, el); if (v.st === 'cower' && H.mode === 'house') { m *= 1.5; hFloat(H, v.x, v.y - 2.2, pick(HFOUND) + ' ×1.5', 'crit'); } return m; }; }
/* 自动扮鬼：躲着的人就在那儿，去找 */
{ const _bot = hBot; hBot = function (H, dt) { const h = H.hero; if (H.mode === 'house' && (H.botT || 0) - dt <= 0 && !h.chase && h.pcd <= 0) { const v = hActive(H).filter(q => q.st === 'cower' && q.wait > 1.2 && hDist(q, h) < 12).sort((a, b) => hDist(a, h) - hDist(b, h))[0]; if (v) h.chase = v; } return _bot(H, dt); }; }
