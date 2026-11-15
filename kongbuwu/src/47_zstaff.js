/* ===== 鬼屋员工的招（RULES 35）=====
   员工不再冲出去追游客，而是站在岗位上（或闪到游客背后）放招：变大变鬼、锤子砸地、尖叫、捉迷藏、鬼画符、地里伸手、齐刷刷回头、点名。
   每个员工两招（第二招好感 25 解锁）。自己放时会挑时机：游客凑成一堆、背过身、快走出范围、残血要补一下；刚被吓跑的不浪费。
   点员工 = 立刻放（挑当下最好的一招）；双人模式队友的员工点游客 = 走到够得着再放。 */
const HSK = {
  bride:  { who: 'wan', n: '鬼新娘现形', kind: 'aoe', r: 2.6, wind: .45, dur: 1.5, pow: 1.05, el: 'jump', cd: 6, st: ['fear', 2], fx: 'grow', sfx: 'stinger', hard: 1, line: ['嫁给我——', '……新郎呢？'], d: '红盖头一掀，人一下子长到天花板那么高。身边一圈都吓到。' },
  slam:   { who: 'wan', need: 25, n: '锤子砸地', kind: 'ring', r: 3.6, wall: 1, wind: .55, dur: .8, pow: 1.2, el: 'chase', cd: 7, stun: .35, fx: 'slam', sfx: 'heavy', shake: .3, hard: 1, line: ['咚！！'], d: '碎颅医生的锤子往地上一砸，震波一圈圈推出去，隔着墙也腿软。' },
  scream: { who: 'xiaoxiao', n: '布偶尖叫', kind: 'ring', r: 4.2, wall: 1, wind: .3, dur: 1, pow: .7, el: 'sound', cd: 5.5, st: ['fear', 2], fx: 'scream', sfx: 'scream', line: ['啊————！！'], d: '布偶里传出一声尖叫，整片区域都听得见。' },
  hide:   { who: 'xiaoxiao', need: 25, n: '捉迷藏', kind: 'blink', r: 5, wind: .25, dur: 1.1, pow: 1.3, el: 'doll', cd: 6, back: 1, stun: .4, fx: 'blink', sfx: 'giggle', hard: 1, line: ['找到你了。'], d: '一眨眼闪到游客背后，贴着后脑勺说话。' },
  scrawl: { who: 'bixian', n: '鬼画符', kind: 'target', r: 5.5, los: 1, wind: .45, dur: 1.3, pow: 1.05, el: 'story', cd: 5.5, splash: 2, st: ['vuln', 3], fx: 'pen', sfx: 'scrape', line: ['墙上的字……在动'], d: '一支笔飞过去，在游客身边的墙上写满血红的字，旁边的人一起破防。' },
  bind:   { who: 'bixian', need: 25, n: '送不走', kind: 'target', r: 4.5, wind: .3, dur: 1.2, pow: .8, el: 'doll', cd: 6.5, root: 1.8, st: ['slow', 3], fx: 'hands', sfx: 'creak', line: ['别走呀。'], d: '地板缝里伸出一把手，抓住脚踝，跑不动。' },
  turn:   { who: 'canmian', n: '齐刷刷回头', kind: 'cone', r: 5, ang: .7, los: 1, wind: .45, dur: 1.3, pow: 1, el: 'doll', cd: 6, fx: 'heads', sfx: 'creak', line: ['（二十四张脸同时转过来）'], d: '朝一个方向，一排低着头的人同时抬头回看。扇形范围。' },
  call:   { who: 'canmian', need: 25, n: '点名', kind: 'target', r: 7, wall: 1, wind: .85, dur: 1.4, pow: 1.6, el: 'name', cd: 8, fx: 'name', sfx: 'bell', hard: 1, line: ['……到了吗？'], d: '黑板上写出一个名字，被点到的那个人隔着墙也听得见。' },
  hand:   { who: '*', n: '伸手', kind: 'target', r: 2.6, los: 1, wind: .25, dur: .8, pow: .9, el: 'jump', cd: 5, fx: 'hands', sfx: 'scrape', line: ['（一只手搭上了肩膀）'], d: '从暗处伸出一只手。' }
};
for (const k in HSK) HSK[k].id = k;
/* 变身时画的鬼（通用恐怖原型，不是原著角色） */
let hSkGhOk = 0; const hSkGhInit = () => { if (hSkGhOk) return; hSkGhOk = 1; Object.assign(GHOST_OF, { 员工鬼新娘: ['redwoman', { dress: '#8a0606', dress2: '#4a0202', dressHi: '#b01010' }], 员工布偶: ['deadchild', { col: '#c88a9a' }], 员工笔仙: ['shadow'], 员工残念: ['student'] }); };
const HSK_GH = { wan: '员工鬼新娘', xiaoxiao: '员工布偶', bixian: '员工笔仙', canmian: '员工残念' };

function hSkList(st) { const aff = (C && C.pets[st.k] ? C.pets[st.k].aff : 100) || 0; const L = Object.values(HSK).filter(S => S.who === st.k && (!S.need || aff >= S.need)); return L.length ? L : [HSK.hand]; }
/* 员工站在游客背后（游客面朝的反方向） */
function hBackTo(q, s) { const [dx, dy] = HD[q.dir || 0]; return (s.x - q.x) * dx + (s.y - q.y) * dy < -.2; }
/* 这一招以 a 为目标（范围招 a 可为空）能吓到谁 */
function hSkHits(H, s, S, a) { const M = H.M, act = hActive(H);
  if (S.kind === 'blink' || S.kind === 'target') { if (!a || hOut(a) || hDist(s, a) > S.r || (S.los && !hmLos(M, s.x, s.y, a.x, a.y))) return []; const out = [a]; if (S.splash) for (const q of act) if (q !== a && hDist(q, a) <= S.splash) out.push(q); return out; }
  if (S.kind === 'cone') { if (!a) return []; const an = Math.atan2(a.y - s.y, a.x - s.x); return act.filter(q => { const d = hDist(q, s); if (d > S.r) return false; if (d < .3) return true; let da = Math.abs(Math.atan2(q.y - s.y, q.x - s.x) - an); if (da > Math.PI) da = 2 * Math.PI - da; return da <= S.ang && hmLos(M, s.x, s.y, q.x, q.y); }); }
  return act.filter(q => hDist(q, s) <= S.r && (S.wall || hmLos(M, s.x, s.y, q.x, q.y))); }
/* 吓一个人值多少：刚被吓跑的不值（除非快晕了），首领、背对着的值更多 */
function hSkVal(H, s, S, q) { const fr = q.u.hp / q.u.mhp; let v = hScaredSt(q) ? (fr < .35 ? 1.1 : .3) : 1; if (q.u.boss) v *= 1.5; if (S.back || hBackTo(q, s)) v *= 1.25; if (hDarkAt(H, q.x, q.y)) v *= 1.1; return v; }
function hSkEval(H, s, S, a) { const hits = hSkHits(H, s, S, a); if (!hits.length) return null; let sc = 0, fresh = 0, low = 0; for (const q of hits) { sc += hSkVal(H, s, S, q); if (!hScaredSt(q)) fresh++; else if (q.u.hp / q.u.mhp < .35) low++; } if (!fresh && !low) return null; return { S, a: a || hits.slice().sort((x, y) => hDist(x, s) - hDist(y, s))[0], hits, sc: sc * S.pow, fresh, low }; }
/* 挑一招：need = 必须吓到的人（双人模式点了某个游客） */
function hSkPlan(H, s, need) { let best = null; const act = hActive(H);
  for (const S of hSkList(s)) { const aims = S.kind === 'aoe' || S.kind === 'ring' ? [null] : need ? [need] : act.filter(q => hDist(q, s) <= S.r + .01);
    for (const a of aims) { const p = hSkEval(H, s, S, a); if (!p || (need && !p.hits.includes(need))) continue; if (!best || p.sc > best.sc) best = p; } }
  return best; }
/* 自己放招的时机 */
function hSkAuto(H, st, dt) { const p = hSkPlan(H, st); if (!p) { st.hold = 0; return; } st.hold = (st.hold || 0) + dt;
  if (!H.seenSk) { H.seenSk = 1; hHint(H, 'staff', '员工会挑时机放招：等游客凑成一堆、背过身、快走出范围再出手。点员工 = 马上放。'); }
  const S = p.S, more = hActive(H).some(q => !p.hits.includes(q) && !hScaredSt(q) && hDist(q, st) <= S.r + 2.5),
    slip = p.hits.some(q => !hScaredSt(q) && q.mv && Math.hypot(q.mv.tx - st.x, q.mv.ty - st.y) > S.r - .2),
    face = (S.kind === 'target' || S.kind === 'cone') && !S.back && p.a && !hBackTo(p.a, st) && !p.a.u.boss;
  if (p.fresh >= 2 || p.low || slip || st.hold > (more ? 1.6 : face ? 1 : .3)) hSkCast(H, st, p); }
function hSkCast(H, st, p, manual) { const S = p.S, a = p.a, M = H.M; st.hold = 0; st.dir = hDirTo(st, a); st.cd = S.cd + rnd() * .8;
  const c = st.cast = { k: S.id, t0: H.t, wind: S.wind, dur: S.fx === 'grow' || S.kind === 'blink' ? S.dur : Math.min(S.dur, .5), ax: a.x, ay: a.y, vi: H.vis.indexOf(a), done: 0, man: manual ? 1 : 0 };
  if (S.kind === 'blink') { const [fx, fy] = HD[a.dir || 0], cand = [[-fx, -fy], [fy, fx], [-fy, -fx], [fx, fy]]; for (const [dx, dy] of cand) { const x = Math.round(a.x) + dx, y = Math.round(a.y) + dy; if (!hmSolid(M, M.hs, x, y)) { c.bx = x; c.by = y; break; } } if (c.bx == null) { c.bx = Math.round(a.x); c.by = Math.round(a.y); } }
  hFloat(H, st.x, st.y - 1.9, PETS[st.k].n + ' · ' + S.n, 'staff'); sfx(S.kind === 'ring' || S.kind === 'aoe' ? 'breath' : 'whisper'); H.stats.staff = (H.stats.staff || 0) + 1; return true; }
function hSkFire(H, st) { const c = st.cast, S = HSK[c.k], B = H.B; c.done = 1; const a0 = H.vis[c.vi], a = a0 && !hOut(a0) && a0.st !== 'leave' ? a0 : null;
  const src = S.kind === 'blink' ? { x: c.bx, y: c.by } : { x: st.x, y: st.y };
  let hits = S.kind === 'blink' ? (a && hDist(src, a) <= 2.2 ? [a] : []) : hSkHits(H, src, S.kind === 'aoe' || S.kind === 'ring' ? Object.assign({}, S, { r: S.r + .7 }) : S, a);   // 蓄力时走出去小半格，照样算
  if (S.kind === 'target' && !hits.length && a && hDist(src, a) <= S.r + 1.5) hits = [a];   // 风头上刚好走出半格，照样算
  if (a) { c.ax = a.x; c.ay = a.y; }
  if (S.line) { const onT = (S.kind === 'target' || S.kind === 'cone') && a; hFloat(H, onT ? a.x : src.x, onT ? a.y - 2.6 : src.y - 3.1, pick(S.line), 'txt'); }
  for (const q of hits) { const t = q.u, los = hmLos(H.M, src.x, src.y, q.x, q.y);
    const mul = HB.dmg * HB.staffMul * skillMulStaff(st.k) * (S.back || hBackTo(q, src) ? 1.3 : 1) * hDarkMul(H, q) * (S.wall && !los ? .7 : 1) * (t.st.fear ? 1.15 : 1);
    if (t.picky && t.picky === S.el) t.pickyHit = 1;
    hBest(H, doHit(B, st.u, t, S.pow, S.el, { mul }), PETS[st.k].n + ' · ' + S.n + ' → ' + t.n); reactLine(B, t);
    if (t.hp > 0) { if (S.st) addSt(B, t, S.st[0], S.st[1]); if (S.stun && chance(S.stun * (t.boss ? .6 : 1))) addSt(B, t, 'stun', 1); if (!hOut(q)) { hReact(H, q, src, S.hard); if (S.root) q.root = H.t + HB.react + S.root; } } }
  if (!hits.length) hFloat(H, src.x, src.y - 2.2, '扑了个空', 'txt');
  H.skfx = H.skfx || []; H.skfx.push({ k: S.fx, x: src.x, y: src.y, ax: c.ax, ay: c.ay, r: S.r, ang: S.ang || 0, t0: H.t, dur: S.fx === 'hands' && S.root ? S.root + HB.react + .4 : Math.max(.9, S.dur), sk: st.k, n: hits.length });
  /* 放完招追着跑得最狠的那个补两下 */ const fl = hits.filter(q => !hOut(q) && q.u.hp > 0).sort((x, y) => x.u.hp / x.u.mhp - y.u.hp / y.u.mhp)[0]; if (fl && !st.p2) hScStart(H, st, fl, c.dur);
  if (S.shake) H.shake = S.shake; sfx(S.sfx); if (hits.length >= 3) { H.slow = Math.max(H.slow || 0, .35); hLog(H, PETS[st.k].n + '的「' + S.n + '」一下吓到了 ' + hits.length + ' 个人。', 'good'); } hFlush(H); }
/* 每帧：放招中的员工原地不动 */
function hSkTick(H, st) { const c = st.cast; if (!c) return false; const e = H.t - c.t0, S = HSK[c.k];
  if (!c.done) { const a = H.vis[c.vi]; if (a && !hOut(a)) { c.ax = a.x; c.ay = a.y; if (S.kind !== 'aoe' && S.kind !== 'ring') st.dir = hDirTo(st, a); } if (e >= c.wind) hSkFire(H, st); }
  if (e >= c.wind + c.dur) st.cast = null; st.fr = 0; return true; }
function hSkRange(st) { return Math.max(...hSkList(st).map(S => S.r)); }

/* ---------- 画 ---------- */
/* 员工本身：蓄力抖、变身变大、闪到背后、举锤子 */
function hSkStaffDraw(H, g, o, ox, oy, t) { const c = o.cast, S = HSK[c.k], e = H.t - c.t0, w = e < c.wind, k = w ? e / c.wind : Math.min(1, (e - c.wind) / c.dur);
  let x = o.x * 16 - ox, y = o.y * 16 - oy;
  if (S.fx === 'grow' && !w) { const s = 1 + Math.min(1, k * 4) * .9 - Math.max(0, k - .75) * 2.2; if (HSK_GH[o.k] && s > 1.05) { hSkGhInit(); g.save(); g.translate(x + 8, y + 15); g.scale(s, s); g.globalAlpha = .95; ghDraw(g, { name: HSK_GH[o.k], x: 0, feet: 0, dir: o.dir === 1 ? 1 : 2 }); g.restore(); g.globalAlpha = 1; return; } }
  if (S.kind === 'blink' && !w) { const fade = k < .8 ? 1 : 1 - (k - .8) * 5, bx = c.bx * 16 - ox, by = c.by * 16 - oy; g.globalAlpha = .35 * (1 - Math.min(1, k * 3)); hsPerson(g, o.P, x, y, o.dir, 0, .35); for (let i = 1; i <= 3; i++) { const q = i / 4; hsPerson(g, o.P, x + (bx - x) * q, y + (by - y) * q, o.dir, 0, .15 * (1 - Math.min(1, k * 2))); } hsPerson(g, o.P, bx, by, hDirTo({ x: c.bx, y: c.by }, { x: c.ax, y: c.ay }), 0, Math.max(0, fade)); return; }
  if (w) { x += Math.round(Math.sin(t * 60) * k * 1.5); g.fillStyle = `rgba(180,120,255,${.25 + k * .35})`; g.beginPath(); g.ellipse(x + 8, y + 14, 6 + k * 5, 2 + k * 2, 0, 0, 7); g.fill(); }
  hsPerson(g, o.P, x, y, o.dir || 0, 0, 1);
  if (S.fx === 'slam') { const up = w ? k : Math.max(0, 1 - k * 6), hx = x + (o.dir === 1 ? 2 : 12), hy = y + 4 - Math.round(up * 12); g.fillStyle = '#6a5a4a'; g.fillRect(hx, hy, 1, 12 - Math.round(up * 2)); g.fillStyle = '#9aa0a8'; g.fillRect(hx - 2, hy - 2, 5, 4); g.fillStyle = '#d8dde4'; g.fillRect(hx - 2, hy - 2, 5, 1); }
  if (w && S.fx === 'scream') { g.fillStyle = '#1a0a0a'; g.fillRect(x + 7, y + 7, 2, 1 + Math.round(k * 2)); }
  if (w && S.fx === 'pen') { const px = x + 8 + Math.sin(t * 9) * 4, py = y - 6 - k * 4; g.fillStyle = '#d8d0c0'; g.fillRect(Math.round(px), Math.round(py), 1, 6); g.fillStyle = '#8a0a0a'; g.fillRect(Math.round(px), Math.round(py) + 6, 1, 1); } }
/* 蓄力时把范围画出来（玩家看得懂员工要干嘛），放出去以后的效果 */
function hSkDrawOver(H, g, ox, oy, t) {
  for (const o of H.staff) { const c = o.cast; if (!c || c.done) continue; const S = HSK[c.k], k = (H.t - c.t0) / c.wind, x = o.x * 16 + 8 - ox, y = o.y * 16 + 8 - oy, al = .25 + k * .5;
    g.strokeStyle = `rgba(255,70,70,${al})`; g.fillStyle = `rgba(255,40,40,${.06 + k * .1})`; g.lineWidth = 1; g.setLineDash([3, 2]); g.beginPath();
    if (S.kind === 'aoe' || S.kind === 'ring') g.arc(x, y, S.r * 16, 0, 7);
    else if (S.kind === 'cone') { const an = Math.atan2(c.ay - o.y, c.ax - o.x); g.moveTo(x, y); g.arc(x, y, S.r * 16, an - S.ang, an + S.ang); g.closePath(); }
    else { const tx = (S.kind === 'blink' ? c.bx : c.ax) * 16 + 8 - ox, ty = (S.kind === 'blink' ? c.by : c.ay) * 16 + 8 - oy; g.arc(c.ax * 16 + 8 - ox, c.ay * 16 + 8 - oy, (S.splash || .9) * 16, 0, 7); g.moveTo(x, y); g.lineTo(tx, ty); }
    g.fill(); g.stroke(); g.setLineDash([]); }
  const L = H.skfx || []; for (let i = L.length - 1; i >= 0; i--) { const f = L[i], a = (H.t - f.t0) / f.dur; if (a >= 1 || a < 0) { L.splice(i, 1); continue; } const x = f.x * 16 + 8 - ox, y = f.y * 16 + 8 - oy, ax = f.ax * 16 + 8 - ox, ay = f.ay * 16 + 8 - oy, R = f.r * 16;
    if (f.k === 'grow') { const gr = g.createRadialGradient(x, y, 2, x, y, R); gr.addColorStop(0, `rgba(140,0,0,${(1 - a) * .5})`); gr.addColorStop(1, 'rgba(60,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); g.fillStyle = `rgba(120,0,0,${(1 - a) * .7})`; for (let j = 0; j < 14; j++) { const an = j / 14 * 6.28 + a, rr = R * (.3 + a * .7); g.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(y + Math.sin(an) * rr * .7), 2, 3); } }
    else if (f.k === 'slam') { const rr = Math.min(1, a * 1.6) * R; g.strokeStyle = `rgba(230,210,180,${(1 - a) * .9})`; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y + 4, rr, rr * .75, 0, 0, 7); g.stroke(); g.lineWidth = 1; g.strokeStyle = `rgba(30,20,10,${(1 - a) * .9})`; for (let j = 0; j < 7; j++) { const an = j * .9 + 1; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + Math.cos(an) * rr * .5, y + 4 + Math.sin(an) * rr * .35); g.lineTo(x + Math.cos(an + .2) * rr * .75, y + 4 + Math.sin(an + .2) * rr * .55); g.stroke(); } g.fillStyle = `rgba(160,140,120,${(1 - a) * .6})`; for (let j = 0; j < 10; j++) { const an = j * .63; g.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(y + 2 + Math.sin(an) * rr * .7 - a * 8), 2, 2); } }
    else if (f.k === 'scream') { for (let r = 0; r < 4; r++) { const rr = ((a * 2 + r / 4) % 1); g.strokeStyle = `rgba(210,150,255,${(1 - rr) * (1 - a) * .9})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 4, 4 + rr * R, 0, 7); g.stroke(); } g.lineWidth = 1; }
    else if (f.k === 'heads') { const an = Math.atan2(f.ay - f.y, f.ax - f.x); g.fillStyle = `rgba(200,200,220,${(1 - a) * .12})`; g.beginPath(); g.moveTo(x, y); g.arc(x, y, R, an - f.ang, an + f.ang); g.closePath(); g.fill(); for (let j = 0; j < 12; j++) { const d = (.35 + (j % 4) * .2) * R * Math.min(1, a * 3), aa = an + (Math.floor(j / 4) - 1) * f.ang * .6, hx = Math.round(x + Math.cos(aa) * d), hy = Math.round(y + Math.sin(aa) * d); g.fillStyle = `rgba(20,16,20,${1 - a})`; g.fillRect(hx - 2, hy - 3, 5, 5); g.fillStyle = `rgba(230,225,215,${1 - a})`; g.fillRect(hx - 1, hy - 1, 3, 3); if (a > .15) { g.fillStyle = `rgba(20,10,10,${1 - a})`; g.fillRect(hx - 1, hy, 1, 1); g.fillRect(hx + 1, hy, 1, 1); } } }
    else if (f.k === 'pen') { const fl = Math.min(1, a * 3), px = x + (ax - x) * fl, py = y - 10 + (ay - 10 - (y - 10)) * fl - Math.sin(fl * 3.14) * 14; if (a < .35) { g.fillStyle = '#e8e0d0'; g.fillRect(Math.round(px), Math.round(py), 1, 6); } if (a > .3) { const n = Math.floor((a - .3) * 30); g.fillStyle = `rgba(150,8,8,${1 - Math.max(0, a - .7) * 3})`; for (let j = 0; j < Math.min(n, 16); j++) { const cx = ax - 20 + (j % 8) * 5, cy = ay - 22 + Math.floor(j / 8) * 7; g.fillRect(cx, cy, 3, 1); g.fillRect(cx + 1, cy - 2, 1, 5); if (hash(j, 7, 3) > .5) g.fillRect(cx, cy + 2, 3, 1); } } }
    else if (f.k === 'hands') { g.fillStyle = `rgba(10,0,0,${Math.min(.6, (1 - a) * 1.2)})`; g.beginPath(); g.ellipse(ax, ay + 6, 11, 4, 0, 0, 7); g.fill(); const up = Math.min(1, a * 6); for (let j = 0; j < 5; j++) { const hx = ax - 9 + j * 4.5, hh = Math.round((5 + (j % 3) * 2) * up * (1 - Math.max(0, a - .85) * 6)); if (hh <= 0) continue; g.fillStyle = '#c8bcb0'; g.fillRect(Math.round(hx), Math.round(ay + 6 - hh), 2, hh); g.fillRect(Math.round(hx) - 1, Math.round(ay + 6 - hh), 4, 1); } }
    else if (f.k === 'name') { const fl = Math.sin(H.t * 40) > 0 && a < .3; if (fl) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(ax - 40, ay - 40, 80, 80); } g.fillStyle = `rgba(245,245,235,${a < .15 ? a * 6 : 1 - a})`; g.font = 'bold 9px serif'; g.textAlign = 'center'; g.fillText('点 名', ax, ay - 26); g.textAlign = 'left'; g.strokeStyle = `rgba(240,240,230,${(1 - a) * .6})`; g.beginPath(); g.moveTo(ax - 10, ay - 22); g.lineTo(ax + 10, ay - 22); g.stroke(); }
    else if (f.k === 'blink') { g.fillStyle = `rgba(200,140,255,${(1 - a) * .5})`; for (let j = 0; j < 8; j++) { const an = j * .8 + a * 4; g.fillRect(Math.round(x + Math.cos(an) * (6 + a * 10)), Math.round(y - 6 + Math.sin(an) * (4 + a * 8)), 2, 2); } } } }

/* ---------- 一点点追逐（RULES 35 补充）----------
   放完招，员工会离开岗位追着被吓跑的那个游客补吓两下；受惊的游客从岗位附近跑过，闲着的员工也会追出去。
   离岗位最多 6 格，追 3 秒或补够 2 下就回岗位；追的速度只比游客逃跑快一点点，多半是游客定住做动作时追上。 */
const HSC = { leash: 6, t: 3, spd: 3.4, tick: .9, pow: .3, hits: 2, join: 3 };
function hScStart(H, st, v, delay) { if (!v || hOut(v) || st.p2) return; st.ch = { vi: H.vis.indexOf(v), until: H.t + (delay || 0) + HSC.t, n: 0 }; st.ctick = Math.max(st.ctick || 0, delay || 0); }
function hScHit(H, st, v) { const B = H.B, c = st.ch; st.ctick = HSC.tick; if (c) c.n++; st.dir = hDirTo(st, v);
  doHit(B, st.u, v.u, HSC.pow, 'chase', { mul: HB.dmg * HB.staffMul * skillMulStaff(st.k) * hDarkMul(H, v) * (v.u.st.fear ? 1.15 : 1) }); if (v.u.hp > 0 && !hOut(v)) hReact(H, v, st);
  hFx(H, 'chase', v.x, v.y); hFloat(H, st.x, st.y - 1.6, pick(['别跑——', '等等我呀', '嘿嘿……', '抓到了！']), 'staff'); sfx('steps'); H.stats.staffChase = (H.stats.staffChase || 0) + 1; hFlush(H); }
function hScTick(H, st, dt) { const M = H.M; if (st.tx == null) { st.tx = st.home[0]; st.ty = st.home[1]; st.x = st.tx; st.y = st.ty; } st.walked = st.walked || 0; st.ctick = (st.ctick || 0) - dt;
  if (st.mv) { hMove(st, dt); st.away = true; return; }
  const hd = q => Math.hypot(q.x - st.home[0], q.y - st.home[1]);
  let c = st.ch, v = c && H.vis[c.vi]; if (c && (!v || hOut(v) || v.st === 'leave' || H.t > c.until || c.n >= HSC.hits || hd(v) > HSC.leash)) { st.ch = c = null; v = null; }
  if (!c && !st.away) { const j = hActive(H).filter(q => hScaredSt(q) && hDist(q, st) <= HSC.join && hd(q) <= HSC.leash).sort((a, b) => hDist(a, st) - hDist(b, st))[0]; if (j) { hScStart(H, st, j); c = st.ch; v = j; hFloat(H, st.x, st.y - 1.6, PETS[st.k].n + '：追！', 'staff'); } }
  if (v) { const d = hDist(st, v); if (d <= 1.45 && st.ctick <= 0) { hScHit(H, st, v); return; }
    if (d > 1) { const n = hmNext(M, hmField(M, Math.round(v.x), Math.round(v.y), 'h'), st.tx, st.ty, 'h'); if (n && Math.hypot(n[0] - st.home[0], n[1] - st.home[1]) <= HSC.leash) { hStepTo(st, n[0], n[1], HSC.spd); st.away = true; return; } }
    st.dir = hDirTo(st, v); st.x = st.tx; st.y = st.ty; st.fr = 0; return; }
  if (st.tx !== st.home[0] || st.ty !== st.home[1]) { const n = hmNext(M, hmField(M, st.home[0], st.home[1], 'h'), st.tx, st.ty, 'h'); if (n) { hStepTo(st, n[0], n[1], HB.hero); st.away = true; return; } st.tx = st.home[0]; st.ty = st.home[1]; }
  st.x = st.tx; st.y = st.ty; st.away = false; st.fr = 0; }
