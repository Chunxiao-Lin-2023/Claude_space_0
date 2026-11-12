/* ================= 鬼屋地图：白天亲自扮鬼接待游客 + 夜里被追、躲藏 =================
   百物语那样的俯视房间地图。白天：先布置惊吓点和员工，再控制陈歌（点哪走哪）躲、追、拉机关。
   夜里：大战前先被追——躲进柜子、拿到关键道具或等员工准备好，再进对峙。
   数值都在 HB 里；地图在 48_hmaps.js。 */
const HB = { dmg: 1.5, bossHp: .65, round: 2.6, mockEvery: 4, devCd: 5, devRange: 4.6, zone: 2, staffCd: 5, staffMul: .8, staffRange: 2, pounceCd: 2.4, chaseTick: .9, chasePow: .3,
  walk: 1.45, panic: 3, flee: 3.8, leave: 2.4, hero: 3.7, heroChase: 4.5, enterGap: 7, seeDist: 3.4, seeCd: 6, exposeAtm: .05, exposeHp: .06, tMax: 170,
  bossSee: 7.5, bossSpd: 3.05, bossPatrol: 2, senseHit: .55, sense0: 3, sense: 6, bossSense: 2.6 };
const HD = [[0, 1], [-1, 0], [1, 0], [0, -1]];
const HLIGHT = { candle: [2.2, 'rgba(255,170,80,.16)'], candles: [2.8, 'rgba(255,160,70,.2)'], lantern: [3, 'rgba(255,90,60,.2)'], lamp: [3, 'rgba(255,220,160,.14)'], stonelantern: [2.6, 'rgba(255,180,90,.16)'], tv: [2.4, 'rgba(140,170,255,.18)'], vending: [2.6, 'rgba(160,220,255,.16)'], streetlamp: [3.6, 'rgba(255,230,170,.14)'], fireplace: [3, 'rgba(255,120,40,.22)'] };
const HFLAT = new Set(['note', 'paper', 'key', 'item', 'sparkle', 'coin', 'footprints', 'stain', 'puddle', 'handprint', 'newspaper', 'photo', 'scissors', 'knife', 'cup', 'salt', 'rice', 'thread', 'paw', 'candy', 'flashlight', 'match', 'towel', 'book', 'rope', 'shoes', 'cushion', 'incense', 'linen', 'rug']);
/* 机关：鬼屋的手段 → 地图上的道具外观 */
const DEV_SPR = { jump: ['closet', '开门杀柜'], lights: ['switch', '电闸'], paper: ['doll', '纸人'], story: ['candles', '故事录音'], friday: ['tv', '老电视'], jiayi: ['altar', '喜堂唢呐'], livedoll: ['doll', '活偶'] };
const HSTAFF_OK = k => PETS[k] && (PETS[k].m === 'd' || PETS[k].m === 'b');
let HS = null, hsDone = null;

/* ---------- 地图 ---------- */
function hmBuild(id) {
  const D = HMAPS[id], w = D.w, h = D.h, N = w * h;
  const M = { id, D, w, h, t: new Array(N).fill('wall'), vs: new Uint8Array(N), hs: new Uint8Array(N), ents: [], slots: [], staff: [], hides: [], rooms: [], sec: new Uint8Array(N), fields: {} };
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) M.t[y * w + x] = t; };
  for (const n in D.rooms) { const [x0, y0, x1, y1, fl] = D.rooms[n]; M.rooms.push({ n, x0, y0, x1, y1 }); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, fl || D.fl); }
  for (const p of D.tiles || []) { const [t, x0, y0, x1, y1] = p; for (let y = y0; y <= (y1 ?? y0); y++) for (let x = x0; x <= (x1 ?? x0); x++) set(x, y, t); }
  for (const n in D.inner || {}) { const [x0, y0, x1, y1, fl] = D.inner[n]; M.rooms.push({ n, x0, y0, x1, y1 }); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, fl || D.fl); }
  const near = (x, y) => { for (const [dx, dy] of HD) { const t = M.t[(y + dy) * w + x + dx]; if (t && t !== 'wall' && t !== 'void') return t; } return D.fl; };
  for (const d of D.doors || []) set(d[0], d[1], d[2] || near(d[0], d[1]));
  for (const d of [D.enter, D.exit]) set(d[0], d[1], near(d[0], d[1]));
  for (const d of D.secret || []) { set(d[0], d[1], near(d[0], d[1])); M.sec[d[1] * w + d[0]] = 1; }
  for (let i = 0; i < N; i++) { const t = M.t[i], td = TILE[t]; const so = t === 'wall' || t === 'void' || (td ? td.solid : true); M.vs[i] = so || M.sec[i] ? 1 : 0; M.hs[i] = so ? 1 : 0; }
  const ent = (spr, x, y, o) => { const e = Object.assign({ spr, x, y, w: 1, h: 1 }, o || {}); e.flat = e.flat ?? HFLAT.has(spr); if (HLIGHT[spr] && !e.dark) e.light = e.light || HLIGHT[spr]; M.ents.push(e); if (!e.flat && !e.wall) for (let yy = y; yy < y + e.h; yy++) for (let xx = x; xx < x + e.w; xx++) { M.vs[yy * w + xx] = 1; M.hs[yy * w + xx] = 1; } return e; };
  for (const d of D.deco || []) ent(d[0], d[1], d[2], d[3]);
  for (const d of D.hides || []) { const e = ent(d[0] || 'wardrobe', d[1], d[2], Object.assign({ hide: 1 }, d[3])); M.hs[d[2] * w + d[1]] = 0; M.hides.push(e); }
  (D.slots || []).forEach((p, i) => M.slots.push({ i, n: i + 1, x: p[0], y: p[1], k: '', cd: 0, fx: 0 }));
  (D.staff || []).forEach((p, i) => M.staff.push({ i, x: p[0], y: p[1] }));
  M.route = (D.route || []).map(r => typeof r === 'string' ? hmCenter(M, r) : r); M.route.unshift(D.enter.slice()); M.route.push(D.exit.slice());
  M.start = (D.start || M.route[0]).slice(); M.path = hmPath(M); for (const s of M.slots) s.pd = M.path.length ? Math.min(...M.path.map(q => Math.hypot(q[0] - s.x, q[1] - s.y))) : 0;
  return M;
}
/* 游客照路线实际走过的格子（机关位要贴着它；完美时机按它算） */
function hmPath(M) { const out = []; if (M.route.length < 2) return out; let [x, y] = M.route[0]; for (let i = 1; i < M.route.length; i++) { const f = hmField(M, M.route[i][0], M.route[i][1], 'v'); for (let n = 0; n < 400; n++) { out.push([x, y]); const nx = hmNext(M, f, x, y, 'v'); if (!nx) break; [x, y] = nx; } } return out; }
function hmCenter(M, n) { const r = M.rooms.find(q => q.n === n); if (!r) return M.D.enter.slice(); let x = Math.round((r.x0 + r.x1) / 2), y = Math.round((r.y0 + r.y1) / 2);
  if (M.vs[y * M.w + x]) { for (let d = 1; d < 6; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d]]) { const xx = x + dx, yy = y + dy; if (xx >= r.x0 && xx <= r.x1 && yy >= r.y0 && yy <= r.y1 && !M.vs[yy * M.w + xx]) return [xx, yy]; } } return [x, y]; }
function hmRoomAt(M, x, y) { x = Math.round(x); y = Math.round(y); return M.rooms.find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1); }
function hmSolid(M, grid, x, y) { return x < 0 || y < 0 || x >= M.w || y >= M.h || grid[y * M.w + x]; }
/* 距离场：从 (tx,ty) 出发 BFS，所有人沿着变小的方向走 */
function hmField(M, tx, ty, who) { const key = who + tx + ',' + ty; if (M.fields[key]) return M.fields[key]; const g = who === 'v' ? M.vs : M.hs, w = M.w, f = new Int16Array(w * M.h).fill(-1), q = [ty * w + tx]; f[q[0]] = 0;
  for (let qi = 0; qi < q.length; qi++) { const c = q[qi], cx = c % w, cy = (c / w) | 0; for (const [dx, dy] of HD) { const nx = cx + dx, ny = cy + dy, k = ny * w + nx; if (nx < 0 || ny < 0 || nx >= w || ny >= M.h || f[k] >= 0 || g[k]) continue; f[k] = f[c] + 1; q.push(k); } }
  return M.fields[key] = f; }
function hmNext(M, f, x, y, who) { const w = M.w, here = f[y * w + x]; if (here <= 0) return null; let best = null, bv = here; const g = who === 'v' ? M.vs : M.hs;
  for (const [dx, dy] of HD) { const nx = x + dx, ny = y + dy; if (hmSolid(M, g, nx, ny)) continue; const v = f[ny * w + nx]; if (v >= 0 && v < bv) { bv = v; best = [nx, ny]; } } return best; }
function hmLos(M, x0, y0, x1, y1) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2); for (let i = 1; i < n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); const t = M.t[y * M.w + x]; if (t === 'wall' || t === 'void' || M.sec[y * M.w + x]) return false; } return true; }
const hDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), hPerf = s => Math.max(.55, (s.pd || 0) + .2);

/* ---------- 走路的人 ---------- */
function hActor(x, y, o) { return Object.assign({ x, y, tx: x, ty: y, mv: null, dir: 0, fr: 0, walked: 0 }, o || {}); }
function hStepTo(a, nx, ny, spd) { a.dir = nx > a.tx ? 2 : nx < a.tx ? 1 : ny < a.ty ? 3 : 0; a.mv = { fx: a.tx, fy: a.ty, tx: nx, ty: ny, p: 0, spd }; }
function hMove(a, dt) { const m = a.mv; if (!m) return false; m.p = Math.min(1, m.p + m.spd * dt); a.x = m.fx + (m.tx - m.fx) * m.p; a.y = m.fy + (m.ty - m.fy) * m.p; a.walked += m.spd * dt * 16; a.fr = [1, 0, 3, 0][Math.floor(a.walked / 7) % 4];
  if (m.p >= 1) { a.tx = m.tx; a.ty = m.ty; a.x = a.tx; a.y = a.ty; a.mv = null; return true; } return false; }

/* ---------- 一场会话 ---------- */
function hsNew(o) { const M = hmBuild(o.map), H = { o, M, mode: o.mode, t: 0, dt: 0, done: false, res: null, phase: o.mode === 'house' ? 'setup' : 'live', fx: [], txt: [], log: [], vis: [], staff: [], tap: null, combo: 0, auto: false, speed: 1, minimap: true, stats: { perfect: 0, exposed: 0, scared: 0, pounce: 0, dev: 0, house: 0 } };
  H.hero = hActor(M.start[0], M.start[1], { P: PPL.陈歌, hidden: false, path: null, chase: null, pcd: 0, ctick: 0, mpLeft: 0 });
  return H; }

/* ===== 白天：接待 ===== */
function houseLayout(sid, M) { const L = C.hh.lay = C.hh.lay || {}; let l = L[sid]; if (!l || !l.v) l = L[sid] = houseAutoLayout(sid, M);
  /* 学了新手段、等级够了多一个机关位、来了新员工：空位自动补上（自己摆好的不动） */ const nd = houseDevices().length, mx = houseMaxDev(), ns = houseStaffList().length;
  if ((l.nd ?? 0) < nd || (l.mx ?? 0) < mx || (l.ns ?? 0) < ns) { const a = houseAutoLayout(sid, M), used = Object.values(l.slots); const spare = Object.values(a.slots).filter(k => { const i = used.indexOf(k); if (i >= 0) { used.splice(i, 1); return false; } return true; });
    for (const s of M.slots) { if (Object.values(l.slots).filter(Boolean).length >= mx || !spare.length) break; if (!l.slots[s.i]) l.slots[s.i] = spare.shift(); }
    const st = houseStaffList().filter(k => !Object.values(l.staff).includes(k)); for (const s of M.staff) if (!l.staff[s.i] && st.length) l.staff[s.i] = st.shift(); }
  l.nd = nd; l.mx = mx; l.ns = ns; return l; }
function houseDevices() { return C.sk.filter(k => SKILLS[k] && (SKILLS[k].m === 'd' || SKILLS[k].m === 'b') && DEV_SPR[k]); }
function houseMaxDev() { return Math.min(8, 2 + Math.floor(C.lv / 4) + (C.hh.up.light ? 1 : 0)); }
function houseStaffList() { return Object.keys(C.pets).filter(HSTAFF_OK); }
function houseAutoLayout(sid, M) { const devs = houseDevices(), max = houseMaxDev(), slots = {}, order = M.slots.map((s, i) => i);
  /* 按路线先后放：越往里放越贵的 */ const list = devs.slice().sort((a, b) => SKILLS[b].pow * (SKILLS[b].all ? 1.4 : 1) - SKILLS[a].pow * (SKILLS[a].all ? 1.4 : 1)); while (list.length < max && devs.includes('jump')) list.push('jump');
  order.slice(0, max).forEach((si, j) => { if (list[j]) slots[si] = list[j]; }); const staff = {}; houseStaffList().slice(0, M.staff.length).forEach((k, i) => { staff[i] = k; }); return { v: 1, slots, staff, nd: devs.length, mx: max, ns: houseStaffList().length }; }
function houseApplyLayout(H) { const M = H.M, l = houseLayout(H.o.scene, M), devs = houseDevices(); let n = 0; const used = {};
  for (const s of M.slots) { const k = l.slots[s.i]; if (k && devs.includes(k) && n < houseMaxDev() && (!used[k] || (k === 'jump' && used[k] < 2))) { s.k = k; used[k] = (used[k] || 0) + 1; n++; } else s.k = ''; }
  H.staff = []; for (const sp of M.staff) { const k = l.staff[sp.i]; if (k && C.pets[k] && HSTAFF_OK(k) && !H.staff.some(s => s.k === k)) H.staff.push(hActor(sp.x, sp.y, { k, home: [sp.x, sp.y], u: petUnit(k), cd: 1.5 + H.staff.length, pop: 0, P: pplOf(PETS[k].n === '殷小小' ? '小小' : PETS[k].n), off: false })); } }
function houseStart(H) { const B = H.B, M = H.M; houseApplyLayout(H); H.phase = 'live'; H.t = 0;
  const ppl = H.o.ppl || B.foes.length, extra = Math.max(0, ppl - B.foes.length), per = Math.min(3, Math.ceil(extra / B.foes.length));
  B.foes.forEach((u, i) => { const P = u.boss || ['gaoru', 'heshan', 'feiyl', 'zhujn', 'wanghl', 'wangwl'].includes(u.id) ? pplOf(MOBS[u.id].n) : pplOf(u.n + i + C.day); const v = hActor(M.route[0][0], M.route[0][1], { u, P, st: 'wait', at: i * HB.enterGap + (i ? 0 : .6), wi: 1, wait: 0, seeCd: 0, mockN: 0, ftrail: [], fol: [], bub: null, light: u.trait === 'torch' ? 3.2 : 1.8, tags: 0 });
    for (let j = 0; j < (u.boss ? 0 : per); j++) v.fol.push({ P: pplOf('同伴' + i + j + C.day), lag: 4 + j * 4 }); H.vis.push(v); });
  hsRule(H, 'start'); hLog(H, '开门营业。' + B.foes.length + ' 批游客在门口排着队。', 'sys'); sfx('door'); musicMode('scare'); }
/* 走进鬼屋的游客 */
function hInside(H) { return H.vis.filter(v => v.st !== 'wait' && v.st !== 'gone'); }
function hActive(H) { return H.vis.filter(v => v.st !== 'wait' && v.st !== 'gone' && v.st !== 'flee' && v.st !== 'leave'); }
function hVisTick(H, v, dt) { const M = H.M, u = v.u;
  if (v.st === 'wait') { if (H.t >= v.at) { v.st = 'walk'; hBub(H, v, '……进去了？', 1.6); sfx('creak'); } return; }
  if (v.st === 'gone') return;
  v.seeCd -= dt; if (v.bub && v.bub.until < H.t) v.bub = null;
  if (v.mv) { hMove(v, dt); v.ftrail.unshift([v.x, v.y, v.dir, v.fr]); if (v.ftrail.length > 20) v.ftrail.pop(); return; }
  const at = (x, y) => v.tx === x && v.ty === y;
  if (v.st === 'flee' || v.st === 'leave') { const ex = M.route[M.route.length - 1]; if (at(ex[0], ex[1])) { v.st = 'gone'; return; } const n = hmNext(M, hmField(M, ex[0], ex[1], 'v'), v.tx, v.ty, 'v'); if (n) hStepTo(v, n[0], n[1], v.st === 'flee' ? HB.flee : HB.leave); else v.st = 'gone'; return; }
  if (u.st.stun) { v.fr = 0; return; }
  if (v.st === 'phone') { v.wait -= dt; if (v.wait <= 0) v.st = 'walk'; return; }
  if (v.st === 'look') { v.wait -= dt; v.dir = [0, 1, 3, 2][Math.max(0, Math.floor(v.wait * 1.6)) % 4]; if (v.wait <= 0) v.st = 'walk'; return; }
  if (v.st === 'panic') { v.wait -= dt; if (v.wait <= 0) v.st = 'walk'; }
  /* 规则：抢校牌 / 找员工（剧情战） */
  const goal = hsRule(H, 'goal', v); let tgt = goal || M.route[Math.min(v.wi, M.route.length - 1)];
  if (!goal && at(tgt[0], tgt[1])) { if (v.wi >= M.route.length - 1) { v.st = 'gone'; hLog(H, u.n + ' 走出了出口' + (u.hp > 0 ? '，回头笑了一声。' : '。'), u.hp > 0 ? 'warn' : ''); return; } v.wi++; if (v.st !== 'panic' && v.wi > 1) { v.st = 'look'; v.wait = 1.1 + rnd() * .8; } return; }
  if (goal && at(goal[0], goal[1])) { hsRule(H, 'reach', v); return; }
  const n = hmNext(M, hmField(M, tgt[0], tgt[1], 'v'), v.tx, v.ty, 'v'); if (!n) { v.wi++; return; }
  const spd = v.st === 'panic' ? HB.panic : HB.walk * (u.spd / 10) * (u.st.slow ? .6 : 1) * (u.st.dark ? .75 : 1); hStepTo(v, n[0], n[1], spd); }
/* 游客看见陈歌：拆穿 */
function hSee(H, v) { const h = H.hero; if (h.hidden || v.seeCd > 0 || v.u.st.dark || v.st === 'panic' || v.st === 'flee' || v.st === 'leave' || v.st === 'wait') return false; const dx = h.x - v.x, dy = h.y - v.y, d = Math.hypot(dx, dy); if (d > HB.seeDist || d < .2) return false;
  const [fx, fy] = HD[v.dir]; if ((dx * fx + dy * fy) < d * .35 && v.st !== 'look') return false; return hmLos(H.M, v.x, v.y, h.x, h.y); }
function hExpose(H, v, who) { const B = H.B; v.seeCd = HB.seeCd; H.stats.exposed++; const a = Math.round(B.hero.mhp * HB.exposeAtm * (H.rule && H.rule.cam && v.u.id === 'feiyl' ? 2 : 1)); B.hero.hp = Math.max(0, B.hero.hp - a); v.u.hp = Math.min(v.u.mhp, v.u.hp + Math.round(v.u.mhp * HB.exposeHp));
  hBub(H, v, pick(who === 'staff' ? ['那是工作人员吧？', '我看见拉链了。', '化妆的，别怕。'] : ['工作人员吧？', '我看见你了哈。', '老板，你鞋带开了。', '那人在躲什么？']), 1.8); hFloat(H, H.hero.x, H.hero.y - 1, '被看见 · 氛围 -' + a, 'bad'); hLog(H, v.u.n + ' 看见了陈歌——氛围 -' + a, 'warn'); sfx('miss'); }
/* 每一“回合”：游客拆台、状态结算、场景特色 */
function hRound(H) { const B = H.B, ins = hInside(H).filter(v => v.st !== 'flee' && v.st !== 'leave'); B.turn++; const all = B.foes; B.foes = ins.map(v => v.u);
  for (const v of ins) { const u = v.u; tickSt(B, u); if (u.hp <= 0) continue; v.mockN++; if (u.st.fear || u.st.stun || v.st === 'panic' || (v.mockN % HB.mockEvery)) continue; const n0 = B.log.length; mobAct(B, u); planMob(B, u); const ln = B.log.slice(n0).map(l => l.s).filter(s => s.startsWith(u.n)).pop(); if (ln) hBub(H, v, ln.slice(u.n.length).replace(/^[ ·：]+/, ''), 2.2, u.intent && u.intent.exec); if (u.st.phone === undefined && /手机/.test(ln || '')) { v.st = 'phone'; v.wait = 2; } }
  if (ins.some(v => v.u.hp > 0)) sceneTurn(B); B.foes = all; B.result = null; hFlush(H); }
/* 战斗事件 → 地图上的飘字 */
function hFlush(H) { const B = H.B; for (const e of B.ev) { const v = e.who === 'hero' ? null : H.vis.find(q => q.u.key === e.who); const x = v ? v.x : H.hero.x, y = v ? v.y - 1.4 : H.hero.y - 1.6;
    if (e.t === 'hit') { if (e.who === 'hero') hFloat(H, H.hero.x, H.hero.y - 1.2, '氛围 -' + e.v, 'bad'); else if (v) hFloat(H, x, y, (e.crit ? '暴击 ' : e.weak ? '弱点 ' : '') + '-' + e.v, e.crit || e.weak ? 'crit' : 'dmg'); }
    else if (e.t === 'txt' && v) hFloat(H, x, y - .4, e.txt, 'txt'); else if (e.t === 'banner' && e.who === 'hero' && /连段|全场|完美/.test(e.txt)) hFloat(H, H.hero.x, H.hero.y - 2, e.txt, 'crit'); }
  B.ev = []; for (let i = H.logN || 0; i < B.log.length; i++) { const l = B.log[i]; if (l.cls === 'say' || l.cls === 'gain' || l.cls === 'warn' || l.cls === 'epic') hLog(H, l.s, l.cls); } H.logN = B.log.length;
  for (const v of H.vis) if (v.u.hp <= 0 && v.st !== 'flee' && v.st !== 'gone' && v.st !== 'wait') hScared(H, v); }
function hScared(H, v) { v.st = 'flee'; v.mv = v.mv; H.stats.scared++; H.burst = (H.burst || 0) + 1; hBub(H, v, pick(['啊啊啊啊——！', '妈呀！！', '让我出去！', '我不玩了！！']), 2); hFloat(H, v.x, v.y - 2, '吓退！', 'crit'); sfx('scream'); H.shake = .25; hsRule(H, 'scared', v); }

/* ---------- 陈歌 ---------- */
function hHeroTick(H, dt) { const h = H.hero, M = H.M; h.pcd -= dt; h.ctick -= dt;
  if (h.mv) { if (hMove(h, dt)) { h.hidden = M.hides.some(e => e.x === h.tx && e.y === h.ty); if (h.hidden) { sfx('creak'); if (H.mode === 'chase') hChaseHid(H); } } else return; }
  if (h.chase) { const v = h.chase; if (!v.u ? false : (v.st === 'flee' || v.st === 'gone' || v.st === 'leave')) h.chase = null; else if (H.mode === 'house') { const d = hDist(h, v); if (d <= 1.5 && h.pcd <= 0) hPounce(H, v); if (v.st === 'panic' && d <= 1.45 && h.ctick <= 0) hChaseHit(H, v); if (d > 1) h.path = [Math.round(v.x), Math.round(v.y)]; else h.path = null; } }
  if (h.path) { const [tx, ty] = h.path; if (h.tx === tx && h.ty === ty) { h.path = null; return; } const n = hmNext(M, hmField(M, tx, ty, 'h'), h.tx, h.ty, 'h'); if (!n) { h.path = null; return; } hStepTo(h, n[0], n[1], h.chase ? HB.heroChase : HB.hero); h.hidden = false; } }
function hGo(H, x, y) { const h = H.hero, M = H.M; x = clamp(Math.round(x), 0, M.w - 1); y = clamp(Math.round(y), 0, M.h - 1); h.chase = null;
  if (hmSolid(M, M.hs, x, y)) { let best = null, bd = 99; for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) if (!hmSolid(M, M.hs, xx, yy) && hmField(M, xx, yy, 'h')[h.ty * M.w + h.tx] >= 0) { const d = Math.abs(xx - x) + Math.abs(yy - y); if (d < bd) { bd = d; best = [xx, yy]; } } if (!best) return; [x, y] = best; }
  if (hmField(M, x, y, 'h')[h.ty * M.w + h.tx] < 0) return; h.path = [x, y]; }
function hPounce(H, v) { const B = H.B, h = H.hero; const k = C.sk.includes('chase') && C.mp >= SKILLS.chase.cost ? 'chase' : 'jump', S = SKILLS[k];
  let mul = HB.dmg * skillMul(k) * (h.hidden || v.u.st.dark ? 1.5 : 1) * (v.st === 'look' ? 1 : 1.1); C.mp -= S.cost; profUse(k); h.pcd = HB.pounceCd; H.stats.pounce++;
  if (v.u.picky && v.u.picky === S.el) v.u.pickyHit = 1; doHit(B, B.hero, v.u, S.pow, S.el, { mul }); reactLine(B, v.u); if (v.u.hp > 0 && S.stun && chance(S.stun * (v.u.boss ? .6 : 1))) addSt(B, v.u, 'stun', 1);
  if (v.u.hp > 0) { v.st = 'panic'; v.wait = 2.6; v.mv = null; } h.hidden = false; H.shake = .18; hFx(H, 'pounce', v.x, v.y, k); sfx(k === 'chase' ? 'scrape' : 'stinger'); hLog(H, k === 'chase' ? '陈歌拖着铁锤追了上去。' : '陈歌从暗处扑了出去。', ''); hFlush(H); }
function hChaseHit(H, v) { const B = H.B; H.hero.ctick = HB.chaseTick; v.wait = Math.max(v.wait, 1.4); doHit(B, B.hero, v.u, HB.chasePow, 'chase', { mul: HB.dmg * skillMul(C.sk.includes('chase') ? 'chase' : 'jump') }); if (rnd() < .3) sfx('steps'); hFlush(H); }

/* ---------- 机关 ---------- */
function hDevTargets(H, s) { return hActive(H).filter(v => Math.max(Math.abs(v.x - s.x), Math.abs(v.y - s.y)) <= HB.zone + .3 && hmLos(H.M, s.x, s.y, v.x, v.y)); }
function hDevInRange(H, s) { return hDist(H.hero, s) <= HB.devRange; }
function hDevReady(H, s) { return s.k && s.cd <= 0; }   /* 机关是道具：不耗精神（只有陈歌亲自扮碎颅医生扑人才耗） */
function hTrigger(H, s, quiet) { const B = H.B, S = SKILLS[s.k]; if (!s.k) return false; if (s.cd > 0) { if (!quiet) toast('机关还在复位'); return false; }
  if (!hDevInRange(H, s)) { if (!quiet) toast('离得太远，够不着'); return false; } const tg = hDevTargets(H, s); if (!tg.length) { if (!quiet) toast('附近没有游客'); return false; }
  const near = tg.slice().sort((a, b) => hDist(a, s) - hDist(b, s)), perfect = hDist(near[0], s) <= hPerf(s);
  if (H.t - (H.lastDevT || -9) > 7) { B.combo = 0; B.lastK = null; B.rep = 0; } H.lastDevT = H.t; let mul = HB.dmg * skillMul(s.k) * comboMul(B, s.k) * (hsRule(H, 'mul', s) || 1);
  if (perfect) { mul *= PERFECT_MUL; FN().perfect++; H.stats.perfect++; hFloat(H, s.x, s.y - 2.2, '⭕ 完美时机', 'crit'); }
  profUse(s.k); s.cd = HB.devCd; s.fx = 1; H.stats.dev++; H.burst = 0; hLog(H, s.n + ' 号 · ' + S.ic + S.n, '');
  for (const v of (S.all ? tg : [near[0]])) { const t = v.u; let m = mul; if (S.dark && t.st.dark) m *= S.dark; if (S.first && !t.acted) m *= S.first; const soft = softHit(B, t, S); m *= soft; if (t.picky && t.picky === S.el) t.pickyHit = 1;
    doHit(B, B.hero, t, S.pow, S.el, { mul: m }); reactLine(B, t); if (t.hp > 0) { if (S.st) addSt(B, t, S.st[0], S.st[1]); if (soft > 1) addSt(B, t, 'stun', 1); if (S.stun && chance(S.stun * (t.boss ? .6 : 1))) addSt(B, t, 'stun', 1); if (v.st !== 'flee') { v.st = 'panic'; v.wait = 1.6; } } t.acted = true; }
  hFx(H, S.el, s.x, s.y, s.k); sfx(({ jump: 'stinger', light: 'crack', doll: 'creak', story: 'whisper', sound: 'reverse' })[S.el] || 'stinger'); H.shake = perfect ? .3 : .12; hFlush(H);
  if (H.burst >= 2) { B.fullHouse = Math.max(B.fullHouse || 0, H.burst); FN().house++; H.stats.house++; hFloat(H, s.x, s.y - 3, '😱 全场尖叫 ×' + H.burst, 'crit'); hLog(H, '全场尖叫！' + H.burst + ' 批游客一起冲了出去。', 'epic'); } return true; }

/* ---------- 员工 ---------- */
function hStaffTick(H, st, dt) { const B = H.B; st.cd -= dt; if (st.pop > 0) { st.pop -= dt; const k = Math.max(0, st.pop / .7); st.x = st.home[0] + (st.px - st.home[0]) * Math.sin(k * Math.PI) * .6; st.y = st.home[1] + (st.py - st.home[1]) * Math.sin(k * Math.PI) * .6; return; } st.x = st.home[0]; st.y = st.home[1];
  if (st.off || st.cd > 0) return; const tg = hActive(H).filter(v => Math.max(Math.abs(v.x - st.x), Math.abs(v.y - st.y)) <= HB.staffRange + .3 && hmLos(H.M, st.x, st.y, v.x, v.y)); if (!tg.length) return;
  const mv = petMoves(st.k).filter(m => m.c === 'atk' || m.c === 'deb' || m.c === 'buf'); if (!mv.length) return; const m = mv.filter(q => q.c === 'atk').length && chance(.75) ? pick(mv.filter(q => q.c === 'atk')) : pick(mv); const v = tg[0];
  st.cd = HB.staffCd + rnd() * 1.5; st.pop = .7; st.px = v.x; st.py = v.y; hFloat(H, st.x, st.y - 1.8, PETS[st.k].n + ' · ' + m.n, 'staff');
  if (m.c === 'buf') { if (m.st) addSt(B, B.hero, m.st[0], m.st[1]); if (m.see || (m.st && m.st[0] === 'see')) for (const q of hActive(H)) for (const w of q.u.weak) noteWeak(B, q.u, w); }
  else for (const q of (m.all ? tg : [v])) { const t = q.u; doHit(B, st.u, t, m.pow || .5, m.el || 'none', { mul: HB.dmg * HB.staffMul * skillMulStaff(st.k) }); reactLine(B, t); if (t.hp > 0) { if (m.st) addSt(B, t, m.st[0], m.st[1]); if (m.stun && chance(m.stun)) addSt(B, t, 'stun', 1); if (q.st !== 'flee') { q.st = 'panic'; q.wait = 1.3; } } }
  hFx(H, 'staff', v.x, v.y, st.k); sfx(st.k === 'baimao' ? 'cat' : st.k === 'xiaoxiao' ? 'giggle' : st.k === 'bixian' ? 'scrape' : 'whisper'); hFlush(H); }
function skillMulStaff(k) { let m = 1 + relicBonus(C, 'scare'); const P = scenePas(HS && HS.o.scene); void P; return m; }

/* ---------- 剧情战的特殊规则 ---------- */
const HRULES = {
  gaoru: { t: '鹤山躲在学姐身后：先把鹤山吓跑，高汝雪会慌（胆量 -35%）。高汝雪会分析机关：同一个机关对她第二次起效果 -30%。',
    start(H) { const g = H.vis.find(v => v.u.id === 'gaoru'), s = H.vis.find(v => v.u.id === 'heshan'); if (g && s) { s.at = g.at + .8; s.lead = g; } },
    goal(H, v) { if (v.lead && v.lead.st !== 'flee' && v.lead.st !== 'gone' && v.lead.st !== 'wait' && hDist(v, v.lead) > 1.6) return [v.lead.tx, v.lead.ty]; return null; },
    mul(H, s) { const g = H.vis.find(v => v.u.id === 'gaoru'); if (!g || hDist(g, s) > HB.zone + .5) return 1; H.seenDev = H.seenDev || {}; const k = s.i; if (H.seenDev[k]) { hBub(H, g, '这个机关刚才见过了。', 1.8); return .7; } H.seenDev[k] = 1; return 1; },
    scared(H, v) { if (v.u.id !== 'heshan') return; const g = H.vis.find(q => q.u.id === 'gaoru'); if (g && g.u.hp > 0) { const d = Math.round(g.u.mhp * .35); g.u.hp = Math.max(1, g.u.hp - d); hFloat(H, g.x, g.y - 1.6, '学弟跑了 -' + d, 'crit'); hBub(H, g, '鹤山？！你跑什么——', 2); } } },
  feiyl: { cam: 1, t: '费友亮举着摄像头找员工：被他发现的员工会被拍到（氛围 -10%，员工退场）；他看见陈歌拆穿翻倍。朱佳宁时不时站住给外面打电话——好机会。',
    goal(H, v) { if (v.u.id !== 'feiyl' || v.st === 'panic') return null; const f = s => hmField(H.M, s.home[0], s.home[1], 'v')[v.ty * H.M.w + v.tx]; const s = H.staff.filter(q => !q.off && f(q) >= 0 && f(q) <= 6).sort((a, b) => f(a) - f(b))[0]; return s ? s.home : null; },
    reach(H, v) { const s = H.staff.find(q => !q.off && q.home[0] === v.tx && q.home[1] === v.ty) || H.staff.find(q => !q.off && hDist(q, v) <= 1.2); if (s) { s.off = true; s.shot = true; const a = Math.round(H.B.hero.mhp * .1); H.B.hero.hp = Math.max(0, H.B.hero.hp - a); hBub(H, v, '拍到了！这就是你们的“鬼”。', 2); hFloat(H, s.x, s.y - 1.5, '被拍到 · 氛围 -' + a, 'bad'); hLog(H, '费友亮拍到了' + PETS[s.k].n + '。' + PETS[s.k].n + '只好退场。', 'warn'); sfx('static'); } else v.wi = Math.max(v.wi, 1); },
    tick(H, dt) { const z = H.vis.find(v => v.u.id === 'zhujn' && v.st === 'walk'); if (z && rnd() < dt / 9) { z.st = 'phone'; z.wait = 3; hBub(H, z, '喂？对，我们在里面……信号不好……', 3); } } },
  wanghl: { t: '王海龙兄弟在抢校牌：两人一共凑够 8 个就算他们赢走奖金。被吓到慌乱时会把手里的校牌掉在地上。',
    start(H) { H.tags = []; const M = H.M, cand = []; for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (!M.vs[y * M.w + x] && !M.slots.some(s => s.x === x && s.y === y) && hmField(M, M.route[0][0], M.route[0][1], 'v')[y * M.w + x] > 6) cand.push([x, y]);
      for (let i = 0; i < 12 && cand.length; i++) { const j = Math.floor(hash(i, C.day, 7) * cand.length); H.tags.push(cand.splice(j, 1)[0]); } H.tagGot = 0; },
    goal(H, v) { if (v.st === 'panic' || !H.tags || !H.tags.length || H.t > 120) return null; let best = null, bd = 7; for (const t of H.tags) { if (Math.hypot(t[0] - v.x, t[1] - v.y) > 7) continue; const d = hmField(H.M, t[0], t[1], 'v')[v.ty * H.M.w + v.tx]; if (d >= 0 && d < bd) { bd = d; best = t; } } return best; },
    reach(H, v) { const i = H.tags.findIndex(t => t[0] === v.tx && t[1] === v.ty); if (i < 0) return; H.tags.splice(i, 1); v.tags++; H.tagGot++; hFloat(H, v.x, v.y - 1.6, '校牌 ' + H.tagGot + '/8', 'bad'); sfx('coin'); if (H.tagGot >= 8) { H.lost = '兄弟俩举着八个校牌冲了出去：“两万！”'; for (const q of hActive(H)) q.st = 'leave'; } },
    hit(H, v) { if (v.tags > 0 && v.st === 'panic') { v.tags--; H.tagGot--; H.tags.push([v.tx, v.ty]); hFloat(H, v.x, v.y - 1.2, '校牌掉了', 'txt'); } } },
  dorm: { t: '法医学院寝室团：三个人挤在一起走，见过尸体（人偶、开门杀差一点），声音和追逐管用。鹤山还是那个鹤山。' } };
function hsRule(H, ev, a) { const R = H.rule; if (!R || !R[ev]) return null; return R[ev](H, a); }

/* ---------- 每帧 ---------- */
function hStep(H, dt) { if (H.done || H.phase !== 'live') return; H.t += dt; const B = H.B;
  if (H.auto) hBot(H, dt);
  hHeroTick(H, dt);
  if (H.mode === 'chase') return hChaseTick(H, dt);
  for (const s of H.M.slots) { if (s.cd > 0) s.cd -= dt; if (s.fx > 0) s.fx -= dt * 1.4; }
  for (const v of H.vis) { const was = v.st; hVisTick(H, v, dt); if (was !== 'panic' && v.st === 'panic') hsRule(H, 'hit', v); if (hSee(H, v)) hExpose(H, v); }
  for (const st of H.staff) hStaffTick(H, st, dt);
  hsRule(H, 'tick', dt);
  H.rt = (H.rt || 0) + dt; if (H.rt >= HB.round) { H.rt = 0; hRound(H); }
  if (!H.broken && B.hero.hp <= 0) { H.broken = true; hLog(H, '氛围被拆完了。游客们打着哈欠往外走。', 'warn'); for (const v of H.vis) if (v.st !== 'flee' && v.st !== 'gone') { v.st = v.st === 'wait' ? 'gone' : 'leave'; } sfx('bad'); }
  if (H.t > HB.tMax) for (const v of H.vis) if (v.st !== 'flee' && v.st !== 'gone') v.st = v.st === 'wait' ? 'gone' : 'leave';
  if (H.vis.every(v => v.st === 'gone')) hsEnd(H); }

/* ---------- 自动（🤖 和测试） ---------- */
function hBot(H, dt) { H.botT = (H.botT || 0) - dt; if (H.botT > 0) return; H.botT = .2; const h = H.hero, M = H.M;
  if (H.mode === 'chase') return hBotChase(H);
  /* 1. 能拉的机关 */
  for (const s of M.slots) { if (!hDevReady(H, s) || !hDevInRange(H, s)) continue; const tg = hDevTargets(H, s); if (!tg.length) continue; const d = Math.min(...tg.map(v => hDist(v, s))); const leaving = tg.every(v => { const f = hmField(M, s.x, s.y, 'v'); const n = v.mv ? f[v.mv.ty * M.w + v.mv.tx] : 0; return v.mv && n > f[v.ty * M.w + v.tx]; });
    if (d <= hPerf(s) || leaving || (SKILLS[s.k].all && tg.length >= 2) || tg.some(v => v.u.charging)) { hTrigger(H, s, true); return; } }
  /* 2. 追残血的 */ const ac = hActive(H); const low = ac.find(v => v.u.hp < v.u.mhp * .3 && hDist(v, h) < 3.5); if (low && h.pcd <= 0) { h.chase = low; return; }
  if (h.chase && (h.chase.st === 'flee' || h.chase.st === 'gone')) h.chase = null; if (h.chase) return;
  /* 3. 去下一个要经过的机关旁边埋伏 */ const front = ac.slice().sort((a, b) => b.wi - a.wi)[0] || H.vis.find(v => v.st === 'wait'); if (!front) return;
  let best = null, bs = 1e9; for (const s of M.slots) { if (!s.k) continue; const f = hmField(M, s.x, s.y, 'v'), dv = f[front.ty * M.w + front.tx]; if (dv < 0) continue; const ahead = hmRouteIdx(M, s) >= front.wi - 1 ? 0 : 40; const score = dv + ahead + (s.cd > 2 ? 15 : 0); if (score < bs) { bs = score; best = s; } }
  if (!best) return; const lurk = hLurk(H, best); if (lurk && (h.tx !== lurk[0] || h.ty !== lurk[1]) && !h.path) hGo(H, lurk[0], lurk[1]); }
function hmRouteIdx(M, s) { let bi = 0, bd = 1e9; M.route.forEach((r, i) => { const d = Math.hypot(r[0] - s.x, r[1] - s.y); if (d < bd) { bd = d; bi = i; } }); return bi; }
function hLurk(H, s) { const M = H.M; if (s.lurk) return s.lurk; let best = null, bs = 1e9; const near = M.path.filter(q => Math.hypot(q[0] - s.x, q[1] - s.y) <= 8);
  const seen = (x, y) => near.filter(q => Math.hypot(q[0] - x, q[1] - y) <= HB.seeDist + .6 && hmLos(M, q[0], q[1], x, y)).length;
  for (const e of M.hides) { const d = Math.hypot(e.x - s.x, e.y - s.y); if (d <= HB.devRange - .3 && d + 1 < bs) { bs = d + 1; best = [e.x, e.y]; } }
  for (let y = s.y - 4; y <= s.y + 4; y++) for (let x = s.x - 4; x <= s.x + 4; x++) { if (hmSolid(M, M.hs, x, y) || M.hides.some(e => e.x === x && e.y === y)) continue; const d = Math.hypot(x - s.x, y - s.y); if (d > HB.devRange - .3) continue; const sc = seen(x, y) * 3 + d * .4 + 2; if (sc < bs) { bs = sc; best = [x, y]; } }
  return s.lurk = best; }


/* ===== 结束 ===== */
function hsEnd(H) { if (H.done) return; H.done = true; const B = H.B; const n = H.vis.length, k = H.vis.filter(v => v.u.hp <= 0).length; H.scared = k;
  if (H.mode === 'chase') { H.res = H.res || 'ok'; return; }
  const boss = H.vis.filter(v => v.u.boss); H.res = !H.lost && k * 2 >= n && k > 0 && boss.every(v => v.u.hp <= 0) ? 'win' : 'lose'; if (H.res === 'lose' && k * 2 >= n && !H.lost) H.lost = boss.map(v => v.u.n).join('、') + ' 没被吓到，大摇大摆地走了出去。'; B.result = H.res; hLog(H, '收工。吓退 ' + k + '/' + n + '。', H.res === 'win' ? 'gain' : 'warn'); }

/* ===== 夜里：被追 ===== */
function hChaseHid(H) { const b = H.boss; if (b && b.hunt && hmLos(H.M, b.x, b.y, H.hero.x, H.hero.y) && hDist(b, H.hero) <= 4.5) { b.saw = [H.hero.tx, H.hero.ty]; } else if (b) { b.hunt = false; b.last = null; b.saw = null; hFloat(H, H.hero.x, H.hero.y - 1.5, '屏住呼吸', 'txt'); } }
function hChaseTick(H, dt) { const h = H.hero, b = H.boss, M = H.M, c = H.o; if (!h.hidden) b.saw = null;
  if (H.item && !H.item.got && h.tx === H.item.x && h.ty === H.item.y) { H.item.got = true; hFloat(H, h.x, h.y - 1.6, '拿到 · ' + H.item.n, 'crit'); hLog(H, '你拿到了' + H.item.n + '。', 'gain'); sfx('coin'); if (!c.wait) { H.res = 'ok'; return hsEnd(H); } }
  if (c.wait && H.t >= c.wait && (!H.item || H.item.got || !c.need)) { H.res = 'ok'; hLog(H, c.ready || '准备好了。', 'gain'); return hsEnd(H); }
  if (H.t < (c.delay ?? 1.6)) return; b.cd = (b.cd || 0) - dt;
  /* 它“闻得到”你：隔一阵子就往你那片走，拉开一个柜子看看（有一半可能正是你躲的那个） */
  b.senseT = (b.senseT ?? HB.sense0) - dt; if (!b.hunt && !b.saw && b.senseT <= 0) { b.senseT = HB.sense + rnd() * 2; b.look = 0;
    if (h.hidden) { const mine = M.hides.filter(e => Math.hypot(e.x - h.x, e.y - h.y) <= 5), other = mine.filter(e => e.x !== h.tx || e.y !== h.ty), e = rnd() < HB.senseHit ? M.hides.find(q => q.x === h.tx && q.y === h.ty) : other.length ? pick(other) : null; const adj = e && HD.map(d => [e.x + d[0], e.y + d[1]]).find(q => !hmSolid(M, M.vs, q[0], q[1])); if (adj) { b.wp = adj; b.chk = e; } else { const q = [h.tx + Math.round((rnd() - .5) * 8), h.ty + Math.round((rnd() - .5) * 6)]; if (!hmSolid(M, M.vs, q[0], q[1]) && hmField(M, q[0], q[1], 'v')[b.ty * M.w + b.tx] >= 0) { b.wp = q; b.chk = null; } } }
    else { b.wp = [h.tx, h.ty]; b.chk = null; } }
  if (b.mv) { hMove(b, dt); } else {
    const see = !h.hidden && hDist(b, h) <= HB.bossSee && hmLos(M, b.x, b.y, h.x, h.y);
    if (see) { if (!b.hunt) { hBub(H, b, c.shout || '……', 1.4); sfx('stinger'); } b.hunt = true; b.last = [h.tx, h.ty]; }
    let tgt = null; if (b.saw && h.hidden) tgt = b.saw; else if (b.hunt && b.last) tgt = b.last; else { if (!b.wp || (b.tx === b.wp[0] && b.ty === b.wp[1])) {
        if (b.chk) { const e = b.chk; b.chk = null; e.open = 1; setTimeout(() => { e.open = 0; }, 900); sfx('creak'); if (h.hidden && h.tx === e.x && h.ty === e.y) { H.res = 'caught'; hLog(H, c.found || '柜门被拉开了。', 'warn'); H.shake = .5; sfx('scream'); return hsEnd(H); } hBub(H, b, '……', 1); }
        const cand = rnd() < .35 ? M.hides.filter(e => Math.hypot(e.x - b.x, e.y - b.y) < 9) : []; const e = cand.length ? pick(cand) : null; const adj = e && HD.map(d => [e.x + d[0], e.y + d[1]]).find(q => !hmSolid(M, M.vs, q[0], q[1]));
        if (adj) { b.wp = adj; b.chk = e; } else if (!tgt) { const r = pick(M.rooms); b.wp = hmCenter(M, r.n); } b.look = b.look || 1; } tgt = b.wp; }
    if (b.look > 0 && !b.hunt) { b.look -= dt; b.dir = [0, 1, 3, 2][Math.floor(H.t * 2) % 4]; }
    else if (tgt) { if (b.tx === tgt[0] && b.ty === tgt[1]) { if (b.hunt && !see) { b.hunt = false; b.last = null; b.look = 1.4; hBub(H, b, '？', 1); } }
      else { const g = b.ghost ? M.hs : M.vs; void g; const n = hmNext(M, hmField(M, tgt[0], tgt[1], b.saw && h.hidden ? 'h' : 'v'), b.tx, b.ty, b.saw && h.hidden ? 'h' : 'v'); if (n) hStepTo(b, n[0], n[1], (b.hunt || b.saw ? HB.bossSpd : b.chk || b.sensing ? HB.bossSense : HB.bossPatrol) * (c.spd || 1)); else { b.wp = null; b.hunt = false; } } } }
  const d = hDist(b, h); H.heart = d < 5 ? 1 - d / 5 : 0; if (H.heart > .2 && (H.hb = (H.hb || 0) - dt) <= 0) { H.hb = .9 - H.heart * .5; sfx('heart'); }
  if (d < .7 && (!h.hidden || (b.saw && b.saw[0] === h.tx && b.saw[1] === h.ty))) { H.res = 'caught'; hLog(H, h.hidden ? c.found || '柜门被拉开了。' : c.caught || '一只手抓住了你的后领。', 'warn'); H.shake = .5; sfx('scream'); hsEnd(H); } }
function hBotChase(H) { const h = H.hero, b = H.boss, M = H.M; const run = () => { let best = null, bd = 1e9; for (const e of M.hides) { if (e.x === h.tx && e.y === h.ty) continue; const fh = hmField(M, e.x, e.y, 'h')[h.ty * M.w + h.tx], fb = hmField(M, e.x, e.y, 'h')[b.ty * M.w + b.tx]; if (fh < 0 || fb <= fh + 2) continue; if (fh < bd) { bd = fh; best = e; } } if (best) hGo(H, best.x, best.y); };
  if (H.item && !H.item.got) { if (b.hunt && hDist(b, h) < 6) { if (!h.hidden && (!h.path || !M.hides.some(e => e.x === h.path[0] && e.y === h.path[1]))) run(); return; } if (h.hidden && b.hunt) return; if (!h.path || h.path[0] !== H.item.x || h.path[1] !== H.item.y) hGo(H, H.item.x, H.item.y); return; }
  if (!h.hidden && !h.path) { let best = null, bd = 1e9; for (const e of M.hides) { if (e.x === h.tx && e.y === h.ty) continue; const db = Math.hypot(e.x - b.x, e.y - b.y); if (db < 5) continue; const d = Math.hypot(e.x - h.x, e.y - h.y) - db * .6; if (d < bd) { bd = d; best = e; } } if (best) hGo(H, best.x, best.y); } }
function chaseNew(c) { const H = hsNew(Object.assign({ mode: 'chase' }, c)), M = H.M, D = M.D.chase || {}; const st = c.start || D.start || M.start; H.hero.x = H.hero.tx = st[0]; H.hero.y = H.hero.ty = st[1];
  const bp = c.bossAt || D.boss || M.route[M.route.length - 1]; H.boss = hActor(bp[0], bp[1], { P: pplOf(c.boss), n: c.boss, ghost: !!c.ghost, hunt: false });
  const it = c.item ? (c.itemAt || D.item || M.route[2]) : null; if (it) H.item = { x: it[0], y: it[1], n: c.item, got: false }; if (c.intro) hLog(H, c.intro, 'sys'); hLog(H, H.item ? '找到' + c.item + '。' : '撑住。别让它看见你钻进柜子。', 'sys'); return H; }

/* ===== 入口 ===== */
function houseRun(o) { const H = hsNew({ mode: 'house', map: HMAPS[o.scene] ? o.scene : 'mh', scene: o.scene, ppl: o.ppl, title: o.title, epic: o.epic, story: o.story }); const B = battleCreate(o); B.pet = null; H.B = B; HS = H; for (const f of B.foes) if (f.boss) { f.mhp = Math.round(f.mhp * HB.bossHp); f.hp = f.mhp; }
  const ids = B.foes.map(f => f.id); H.rule = ids.includes('gaoru') ? HRULES.gaoru : ids.includes('feiyl') ? HRULES.feiyl : ids.includes('wanghl') ? HRULES.wanghl : (o.story && ids.filter(i => i === 'med').length >= 2 ? HRULES.dorm : null);
  if (o.intro) hLog(H, o.intro, 'sys'); return hsLoop(H); }
function chaseRun(c) { const H = chaseNew(c); HS = H; return hsLoop(H); }
function hsHeadless() { return !!(window.__dbg && (__dbg.instant || __dbg.headless)); }
async function hsLoop(H) { const auto = !!(C.auto || (window.__dbg && __dbg.auto));
  if (hsHeadless() || (auto && window.__dbg)) { H.auto = true; if (H.mode === 'house') houseStart(H); else hsAutoChase(H); let n = 0; while (!H.done && n++ < 8000) hStep(H, .1); if (!H.done) hsEnd(H); return hsFinish(H, true); }
  const done = new Promise(r => { hsDone = r; }); hsClear(); STATE.house = H; STATE.busy = false; applyMode(); hsSize(); musicMode(H.mode === 'house' ? 'scare' : 'door');
  if (H.mode === 'house') { if (H.o.epic) await fxBossCard(H.o.epic); else await stageTransition('布置鬼屋'); hsSetup(H); if (!C.seen.tuth) { C.seen.tuth = 1; await showCard(HTUT.house, 900); } if (auto && H.phase === 'setup') { H.auto = true; hsOpen(); } }
  else { await stageTransition(H.o.title || '快跑'); if (!C.seen.tutc) { C.seen.tutc = 1; await showCard(HTUT.chase, 900); } H.phase = 'live'; hsSize(); hsHud(H); }
  H.last = performance.now(); if (!H.raf) H.raf = requestAnimationFrame(hsFrame); return done; }
function hsAutoChase(H) { H.phase = 'live'; H.res = 'ok'; H.done = true; }
const HTUT = { house: '<div class="c1">亲自扮鬼</div><div class="c3" style="text-align:left">先在地图上的<b>圆圈</b>里放机关、在<b>人形框</b>里安排员工，然后开门。<br><b>点地面</b>：陈歌走过去。<b>点柜子</b>：躲进去。<b>点游客</b>：追上去扑他。<br>游客走进机关的圈里，点机关（或「吓！」）拉动它——<b>正好踩在机关上</b>是完美时机。<br>别让游客<b>看见你</b>：从背后、从柜子里、或者关了灯再出手。</div><div class="c3">点任意处开始</div>',
  chase: '<div class="c1">被追了</div><div class="c3" style="text-align:left"><b>点地面</b>跑过去，<b>点柜子</b>躲进去。<br>它没看见你钻进去，就找不到你。心跳越响，它离你越近。<br>拿到要找的东西（或者撑到员工准备好），就能回头跟它打。</div><div class="c3">点任意处开始</div>' };
let HS_LAST = null;
async function hsFinish(H, quiet) { cancelAnimationFrame(H.raf); const B = H.B; HS_LAST = { mode: H.mode, res: H.res, t: Math.round(H.t), stats: H.stats, scared: H.scared, n: H.vis.length, atm: B ? Math.round(B.hero.hp / B.hero.mhp * 100) : 0, mp: Math.round(C.mp), dmg: B ? H.vis.map(v => Math.round((1 - v.u.hp / v.u.mhp) * 100)) : [] };
  if (H.mode === 'chase') { hsClear(); STATE.house = null; HS = null; applyMode(); if (!quiet) await fxStamp(H.res === 'ok' ? '甩开了' : '被抓住'); return hsResolve(H.res); }
  const res = H.res; let rw = null;
  if (res === 'win') { rw = battleRewards(B); const f = H.scared / H.vis.length; rw.screams = Math.round(rw.screams * f); rw.exp = Math.round(rw.exp * (.5 + .5 * f));
    if (rw.picky) { FN().pickyWin = C.day; C.fans += 60; logLine('挑剔的游客被吓哭了：赏钱 +' + PICKY_MONEY + '，关注 +60', 'gain'); } if (rw.money) gainMoney(rw.money, '门票'); if (rw.screams) { FN().scr += rw.screams; C.hh.screams += rw.screams; logLine('收集尖叫 +' + rw.screams + '（' + C.hh.screams + '/' + BAL.screamPerSpin + '）', 'gain'); } gainExp(rw.exp);
    for (const s of H.staff) if (C.pets[s.k]) { petGainExp(s.k, rw.exp); petAff(s.k, 1); } for (const k in C.pets) if (!H.staff.some(s => s.k === k)) petGainExp(k, Math.round(rw.exp * .3)); }
  B.rw = rw; H.rw = rw; if (quiet) { STATE.house = null; HS = null; return hsResolve(res); }
  sfx(res === 'win' ? 'big' : 'bad'); await fxStamp(res === 'win' ? '吓退' : '不吓人'); hsEndPanel(H); }
function hsResolve(r) { const f = hsDone; hsDone = null; if (f) f(r); return r; }
function hsClear() { for (const id of ['#hsset', '#hshud', '#hsfx']) { const e = $(id); if (e) e.innerHTML = ''; } }
function hsClose() { const H = HS; if (!H || !H.done) return; hsClear(); STATE.house = null; HS = null; applyMode(); musicMode(moodNow()); refresh(); save(); hsResolve(H.res); }
