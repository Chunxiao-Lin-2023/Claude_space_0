/* ================= 鬼屋接待的氛围层（第十四轮，RULES 31） =================
   用户：“游客的路线不清晰，地图不够吓人，道具吓人的方式不够沉浸，主角吓人的时候没有换衣服和武器，开灯关灯也可以用上，氛围感不够”
   1 陈歌的扮相和武器   2 开灯关灯   3 游客路线   4 地图上的脏东西和鬼屋自己闹的动静   5 吓中时的特写   6 暗角、雾、环境声 */

/* —— 1. 扮相：开门前在布置面板上 🎭 换；武器拿在手上，扑人时抡起来 —— */
const HCOS = {
  doctor: { n: '碎颅医生', ch: 1, wp: 'hammer', tip: '扑人 ×1.2', P: P_({ hair: '#141214', hs: 'short', top: '#e4e0d4', coat: 1, bottom: '#3a3a40', mask: 1 }), blood: 1 },
  butcher: { n: '屠夫', ch: 2, wp: 'cleaver', tip: '追着吓 ×1.5', P: P_({ hair: '#141214', hs: 'short', top: '#4a3e34', apron: '#9a8a78', bottom: '#2a2420', hat: 'cap', hatC: '#3a2a20' }), blood: 1 },
  paper: { n: '纸人', ch: 3, wp: 'lantern', tip: '黑屋里贴到 2 格内才会被看见', P: P_({ skin: '#f4f0e8', hair: '#0e0c0c', hs: 'short', top: '#1a1a1e', dress: 1, bottom: '#1a1a1e' }), paper: 1 },
  red: { n: '红衣', ch: 4, wp: 'scissors', tip: '扑人时旁边的游客也掉 SAN', P: P_({ skin: '#e8e0dc', hair: '#0a0808', hs: 'long', top: '#8a0a0a', dress: 1, cover: 1 }) } };
function hChNow() { const q = typeof curQ === 'function' && curQ(); return q ? q.ch : 6; }
function hCosList() { return Object.keys(HCOS).filter(k => HCOS[k].ch <= hChNow()); }
function hCos() { const k = C.f && C.f.hcos; return HCOS[k] && hCosList().includes(k) ? k : 'doctor'; }
function hsCosCycle() { const L = hCosList(), i = L.indexOf(hCos()); F().hcos = L[(i + 1) % L.length]; sfx('tap'); const H = HS; if (H) { H.hero.P = HCOS[hCos()].P; if (H.phase === 'setup') hsSetupHtml(H); } toast('扮相：' + HCOS[hCos()].n + ' · ' + HCOS[hCos()].tip); }
function hsWeapon(g, k, hx, hy, ang) { g.save(); g.translate(hx, hy); g.rotate(ang); const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (k === 'hammer') { R(-.5, -1, 1, 8, '#6a4a2a'); R(-2, 6, 5, 3, '#8a8a92'); R(-2, 8, 2, 1, '#8a1010'); R(2, 6, 1, 1, '#b8b8c0'); }
  else if (k === 'cleaver') { R(-.5, -1, 1, 4, '#3a2a1a'); R(-2, 3, 5, 6, '#b8b8c0'); R(2, 3, 1, 6, '#e8e8f0'); R(-2, 8, 5, 1, '#9a1010'); }
  else if (k === 'lantern') { R(-.5, -2, 1, 4, '#5a3a20'); R(-2, 2, 5, 6, '#f0ece0'); R(-2, 4, 5, 1, '#c03030'); R(-1, 8, 3, 1, '#3a2a1a'); }
  else if (k === 'scissors') { R(-1.5, 0, 1, 7, '#c8c8d0'); R(.5, 0, 1, 7, '#c8c8d0'); R(-2.5, -2, 2, 2, '#8a0a0a'); R(.5, -2, 2, 2, '#8a0a0a'); }
  g.restore(); }
function hsHero(g, H, o, ox, oy, t) { if (o.hidden) return; const K = HCOS[hCos()], P = K.P, x = o.x * 16 - ox, y = o.y * 16 - oy, sw = t - (o.swingT ?? -9), on = sw < .42, dir = on ? (o.sdir ?? o.dir) : o.dir, dy = on ? -Math.round(Math.sin(Math.min(1, sw / .42) * Math.PI) * 3) : 0;
  hsPerson(g, P, x, y + dy, dir, on ? 0 : (o.mv ? o.fr : 0)); const h = Math.round(24 * (P.tall || 1)), Y = y + dy + 16 - h;
  if (K.blood && dir !== 3) { g.fillStyle = '#8a1010'; g.fillRect(x + 5, Y + 13, 2, 1); g.fillRect(x + 9, Y + 15, 1, 2); g.fillRect(x + 7, Y + 18, 2, 1); }
  if (K.paper && dir === 0) { g.fillStyle = '#d04848'; g.fillRect(x + 4, Y + 8, 2, 1); g.fillRect(x + 10, Y + 8, 2, 1); g.fillRect(x + 7, Y + 10, 2, 1); }
  const left = dir === 1, hand = left ? [x + 2, Y + 14] : dir === 3 ? [x + 3, Y + 14] : [x + 13, Y + 14];
  const ang = on ? (-2.7 + Math.min(1, sw / .28) * 3.3) * (left ? -1 : 1) : (Math.sin(t * 5) * .06 + (o.mv ? Math.sin(t * 12) * .22 : 0));
  hsWeapon(g, K.wp, hand[0], hand[1], ang);
  if (on && sw > .2 && sw < .34) { g.strokeStyle = 'rgba(255,240,220,.7)'; g.beginPath(); g.arc(hand[0], hand[1], 9, left ? Math.PI * .6 : -Math.PI * .1, left ? Math.PI * 1.1 : Math.PI * .4); g.stroke(); }
  const pf = t - (H.puffT ?? -9); if (pf < .7) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + pf * 3, r = 4 + pf * 14; g.fillStyle = 'rgba(200,200,210,' + (.6 * (1 - pf / .7)).toFixed(2) + ')'; g.fillRect(Math.round(x + 8 + Math.cos(a) * r - 2), Math.round(y + 6 + Math.sin(a) * r * .6 - 2), 4, 4); } } }

/* —— 2. 开灯关灯：陈歌在哪个房间，💡 就管哪个房间的灯 —— */
const HLIGHT_CD = 4;
function hDarkAt(H, x, y) { const r = hmRoomAt(H.M, x, y); return !!(r && H.lit && H.lit[r.n] === false); }
function hDarkMul(H, v) { return hDarkAt(H, v.x, v.y) ? 1.25 : 1; }
function hLightCan(H) { const h = H.hero, r = hmRoomAt(H.M, h.x, h.y); return r && H.t >= ((H.lcd || {})[r.n] || 0) ? r : null; }
function hLight(H, on) { const h = H.hero, r = hLightCan(H); if (!r) return false; H.lit = H.lit || {}; H.flick = H.flick || {}; H.lcd = H.lcd || {}; on = on ?? H.lit[r.n] === false; if (on === (H.lit[r.n] !== false)) return false;
  H.lit[r.n] = on; H.flick[r.n] = H.t; H.lcd[r.n] = H.t + HLIGHT_CD; sfx(on ? 'tap' : 'crack');
  const ins = hActive(H).filter(v => hmRoomAt(H.M, v.x, v.y) === r);
  if (!on) { hHint(H, 'lightoff', '灯一灭，屋里的游客只能靠手机手电看路：从手电照不到的地方下手，吓人 ×1.25。'); for (const v of ins) { const d = Math.max(1, Math.round(v.u.mhp * .1)); v.u.hp = Math.max(0, v.u.hp - d); if (v.u.hp > 0) { hReact(H, v, v); v.pose = 'shake'; v.emo = { s: '?!', until: H.t + 2 }; } hBub(H, v, pick(['灯怎么灭了？！', '谁关的灯！', '别闹了，开灯啊……', '手机！开手电！']), 1.6); hFloat(H, v.x, v.y - 1.4, '关灯 SAN -' + d, 'dmg'); }
    if (ins.length) { H.stats.lights = (H.stats.lights || 0) + 1; hLog(H, '陈歌关掉了' + r.n + '的灯。', ''); } }
  else for (const v of ins) hBub(H, v, pick(['……亮了。', '吓死我了', '刚才是谁关的？']), 1.2);
  hFlush(H); return true; }
function hRoomEnter(H, v) { if (v.st === 'wait' || hOut(v)) return; const r = hmRoomAt(H.M, v.tx, v.ty); if (r === v.room) return; v.room = r; if (r && H.lit && H.lit[r.n] === false && !hScaredSt(v)) hBub(H, v, pick(['好黑……开手电', '这屋怎么没灯', '你走前面', '手电！手电呢！']), 1.4); }
function hsLight() { const H = HS; if (!H || H.phase !== 'live' || H.done) return; if (!hLight(H)) toast(hmRoomAt(H.M, H.hero.x, H.hero.y) ? '灯还在复位' : '走廊里没有开关'); hsHudTick(H, true); }

/* —— 3. 游客路线：地上一串红脚印，一道光顺着往出口流；每批游客头前一截虚线是他们接下来要走的 —— */
function hsRouteDraw(g, H, ox, oy, t, setup) { const P = H.M.path; if (!P || P.length < 2) return; const n = P.length, head = (t * 7) % n;
  for (let i = 0; i < n - 1; i++) { const [x, y] = P[i], [nx, ny] = P[i + 1]; if (x === nx && y === ny) continue; const ax = x * 16 + 7 - ox, ay = y * 16 + 9 - oy, dx = nx - x, dy = ny - y, d = (head - i + n) % n, hot = d < 7 ? 1 - d / 7 : 0, al = (setup ? .6 : .26) + hot * .55;
    g.fillStyle = 'rgba(255,206,110,' + al.toFixed(2) + ')'; for (let s = 0; s < 16; s += 5) g.fillRect(Math.round(ax + dx * s), Math.round(ay + dy * s), 2, 2);
    if (i % 3 === 1) { g.fillStyle = 'rgba(255,236,190,' + Math.min(1, al + .2).toFixed(2) + ')'; const cx = ax + dx * 8, cy = ay + dy * 8; for (let k = 1; k <= 3; k++) { g.fillRect(Math.round(cx - dx * k + dy * k), Math.round(cy - dy * k + dx * k), 1, 1); g.fillRect(Math.round(cx - dx * k - dy * k), Math.round(cy - dy * k - dx * k), 1, 1); } } }
  const sign = (p, col, up) => { const x = p[0] * 16 - ox, y = p[1] * 16 - oy; g.fillStyle = '#0a1a0a'; g.fillRect(x + 2, y - 7, 12, 7); g.fillStyle = col; g.fillRect(x + 3, y - 6, 10, 5); g.fillStyle = '#e8ffe8'; if (up) { g.fillRect(x + 7, y - 5, 2, 3); g.fillRect(x + 6, y - 4, 4, 1); } else { g.fillRect(x + 5, y - 4, 5, 1); g.fillRect(x + 9, y - 5, 1, 3); g.fillRect(x + 4, y - 5, 1, 3); } };
  sign(H.M.route[0], '#2a6a2a', 1); sign(H.M.route[H.M.route.length - 1], '#1a8a3a', 0); }
function hsNextDraw(g, H, ox, oy, t) { const M = H.M; for (const v of hActive(H)) { if (hScaredSt(v) || v.st === 'leave') continue; const tg = M.route[Math.min(v.wi, M.route.length - 1)]; if (!tg) continue; const f = hmField(M, tg[0], tg[1], 'v'); let x = v.tx, y = v.ty; g.fillStyle = 'rgba(255,120,100,.55)';
    for (let k = 0; k < 5; k++) { const n = hmNext(M, f, x, y, 'v'); if (!n) break; const ax = x * 16 + 8 - ox, ay = y * 16 + 10 - oy, bx = n[0] * 16 + 8 - ox, by = n[1] * 16 + 10 - oy; for (let s = 0; s < 4; s++) if ((s + Math.floor(t * 8)) % 2 === 0) g.fillRect(Math.round(ax + (bx - ax) * s / 4), Math.round(ay + (by - ay) * s / 4), 1, 1); [x, y] = n; } } }

/* —— 4. 地图上的脏东西（缓存一次）+ 鬼屋自己闹的动静 —— */
function hsDecoCache(M) { if (M.deco) return M.deco; const c = M.deco = mk(M.w * 16, M.h * 16), g = c.getContext('2d'), id = M.id.length * 7;
  const isW = (x, y) => x < 0 || y < 0 || x >= M.w || y >= M.h || M.t[y * M.w + x] === 'wall' || M.t[y * M.w + x] === 'void';
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { const i = y * M.w + x, px = x * 16, py = y * 16, r = hash(x, y, 91 + id), r2 = hash(x, y, 17 + id);
    if (isW(x, y)) { if (isW(x, y + 1)) continue; /* 正对着的墙面 */
      if (r < .11) { const hx = px + 3 + r2 * 8, hy = py + 4 + r2 * 4; R(hx, hy + 2, 3, 3, 'rgba(120,8,8,.8)'); for (let f = 0; f < 4; f++) R(hx - 1 + f, hy - 1 - (f === 1 || f === 2 ? 1 : 0), 1, 3, 'rgba(120,8,8,.75)'); R(hx + 1, hy + 5, 1, 3, 'rgba(110,6,6,.6)'); }
      else if (r < .2) { let cx = px + 2 + r2 * 10, cy = py + 2; for (let k = 0; k < 7; k++) { R(cx, cy, 1, 1, 'rgba(0,0,0,.55)'); cx += hash(x, y, k) < .5 ? 1 : -1; cy += 1; } }
      else if (r < .25) { for (let k = 0; k < 3; k++) R(px + 2 + k * 4, py + 5 + (hash(x, k, y) * 4 | 0), 3, 1, 'rgba(110,10,10,.7)'); }
      continue; }
    if (M.vs[i] && !M.sec[i]) continue;
    if (r < .06) { const n = 3 + (r2 * 4 | 0); for (let k = 0; k < n; k++) { const a = hash(x, y, k) * 6.28, d = hash(y, x, k) * 4; R(px + 8 + Math.cos(a) * d, py + 9 + Math.sin(a) * d * .6, 2, 1, 'rgba(110,6,6,.7)'); } R(px + 6, py + 8, 4, 2, 'rgba(90,4,4,.7)'); }
    else if (r < .09) { for (let k = 0; k < 10; k++) R(px + k * 1.5, py + 9 + Math.sin(k * .8 + r2 * 5) * 1.2, 2, 1, 'rgba(90,8,8,.5)'); }
    else if (r < .14) { R(px + 3 + r2 * 8, py + 6 + r2 * 5, 4, 3, 'rgba(210,200,180,.35)'); R(px + 4 + r2 * 8, py + 7 + r2 * 5, 3, 1, 'rgba(40,30,30,.3)'); }
    else if (r < .17) { R(px + 4 + r2 * 6, py + 10, 1, 1, 'rgba(200,190,170,.45)'); R(px + 9, py + 5 + r2 * 6, 2, 1, 'rgba(180,170,150,.4)'); R(px + 6, py + 12, 1, 1, 'rgba(30,20,20,.5)'); }
    if (isW(x - 1, y) && isW(x, y - 1)) for (let k = 0; k < 5; k++) { R(px + k, py, 1, 5 - k, 'rgba(210,210,220,.18)'); R(px, py + k, 5 - k, 1, 'rgba(210,210,220,.18)'); }
    if (isW(x + 1, y) && isW(x, y - 1)) for (let k = 0; k < 5; k++) R(px + 15 - k, py, 1, 5 - k, 'rgba(210,210,220,.18)'); }
  return c; }
function hsAmbTick(H, dt) { if (H.phase !== 'live' || H.done || H.paused) return; H.amb = H.amb || { next: 4 + rnd() * 4, ev: [] }; const A = H.amb; A.ev = A.ev.filter(e => H.t - e.t0 < e.dur);
  if (H.t < A.next) return; A.next = H.t + 6 + rnd() * 7; const M = H.M, ac = hActive(H), rooms = M.rooms.filter(r => (r.x1 - r.x0) >= 2);
  const vr = ac.length && rnd() < .55 ? hmRoomAt(M, ac[0].x, ac[0].y) : null, r = vr || pick(rooms); if (!r) return; const k = pick(['shadow', 'eyes', 'eyes', 'creak', 'flick']);
  if (k === 'shadow') { A.ev.push({ k, t0: H.t, dur: 1.8, r, y: (r.y0 + r.y1) / 2, dir: rnd() < .5 ? 1 : -1 }); sfx('whisper'); }
  else if (k === 'eyes') { A.ev.push({ k, t0: H.t, dur: 1.6, x: pick([r.x0, r.x1]), y: r.y0 }); }
  else if (k === 'flick') { H.flick = H.flick || {}; H.flick[r.n] = H.t; sfx('crack'); }
  else sfx(pick(['creak', 'drip', 'steps']));
  if (vr && k !== 'creak') for (const v of ac) if (hmRoomAt(M, v.x, v.y) === r && !hScaredSt(v)) { const d = Math.max(1, Math.round(v.u.mhp * .04)); v.u.hp = Math.max(0, v.u.hp - d); hBub(H, v, pick(['你看见没有？', '那边有人……', '刚才是不是动了一下', '我不想往前走了']), 1.4); }
  hFlush(H); }
function hsAmbDraw(g, H, ox, oy, t) { if (!H.amb) return; for (const e of H.amb.ev) { const a = (H.t - e.t0) / e.dur;
  if (e.k === 'shadow') { const r = e.r, x = (e.dir > 0 ? r.x0 + (r.x1 - r.x0) * a : r.x1 - (r.x1 - r.x0) * a) * 16 - ox, y = e.y * 16 - oy, al = Math.sin(a * Math.PI) * .55; g.fillStyle = 'rgba(8,4,10,' + al.toFixed(2) + ')'; g.fillRect(Math.round(x + 4), Math.round(y - 12), 8, 26); g.fillRect(Math.round(x + 5), Math.round(y - 16), 6, 5); g.fillRect(Math.round(x + 3), Math.round(y - 9), 1, 12); g.fillRect(Math.round(x + 12), Math.round(y - 9), 1, 12); }
  else if (e.k === 'eyes') { if (Math.floor(a * 9) === 4) continue; const x = e.x * 16 - ox + 4, y = e.y * 16 - oy + 6, al = Math.min(1, Math.sin(a * Math.PI) * 1.6); g.fillStyle = 'rgba(230,20,20,' + al.toFixed(2) + ')'; g.fillRect(x, y, 2, 1); g.fillRect(x + 5, y, 2, 1); } } }

/* —— 5. 吓中时的特写：一条黑带，左边游客吓到变形的脸，右边扑过来的东西，中间大红字 —— */
const HCUTGH = { hang: ['student'], hand: ['redwoman'], blood: ['deformed'], baby: ['deadchild'], steps: ['slender'], phone: ['shadow'], dollwall: ['deadchild'], coffin: ['drowned'], sp_mh: ['redwoman'], sp_ws: ['knifeman'], sp_zombie: ['drowned'], friday: ['mirrorghost'],
  jump: ['redwoman'], sound: ['shadow'], story: ['twoface'], doll: ['deadchild'], light: ['shadow'], chase: ['knifeman'] };
const HGHC = {};
function hsGhSnap(key, o) { const ck = key + JSON.stringify(o || {}); if (HGHC[ck]) return HGHC[ck]; const G = GH[key]; if (!G) return null; const c = mk(G.w, G.h), g = c.getContext('2d'); G.draw((x, y, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h)); }, 1.3, o || {}); return HGHC[ck] = c; }
function hCut(H, v, k, faint) { if (!SET.motion || hsHeadless() || !v || (H.cut && H.t - H.cut.t0 < .5) || H.t - (H.cutT ?? -9) < 2.6) return; H.cutT = H.t;
  const hero = k === 'hero', D = !hero && hDev(k), el = D && D.el, gh = hero ? null : (HCUTGH[k] || HCUTGH[el] || ['shadow']);
  H.cut = { t0: H.t, v, P: v.P, faint, gh, hero, txt: hero ? HCOS[hCos()].n + '！' : (D ? D.n + '！' : '！！') }; H.shake = Math.max(H.shake, .3); }
function hsFace(g, P, x, y, sc, faint, t) { const skin = P.skin || '#e8cdb0', hair = P.hair || '#1a1414', R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + a * sc), Math.round(y + b * sc), Math.ceil(w * sc), Math.ceil(h * sc)); };
  if (P.hs === 'long' || P.hs === 'twin') { R(0, 2, 2, 11, hair); R(10, 2, 2, 11, hair); }
  R(2, 2, 8, 10, skin); R(1, 3, 1, 7, skin); R(10, 3, 1, 7, skin); R(2, 0, 8, 3, hair); R(1, 1, 10, 2, hair); R(1, 2, 1, 3, hair); R(10, 2, 1, 3, hair);
  g.fillStyle = 'rgba(70,90,150,.22)'; g.fillRect(Math.round(x + 2 * sc), Math.round(y + 2 * sc), 8 * sc, 10 * sc);
  if (faint) { R(3, 5, 2, 1, '#2a1a1a'); R(4, 4, 1, 3, '#2a1a1a'); R(7, 5, 2, 1, '#2a1a1a'); R(8, 4, 1, 3, '#2a1a1a'); R(5, 9, 2, 1, '#3a0808'); }
  else { R(3, 4, 2, 2, '#fff'); R(7, 4, 2, 2, '#fff'); R(4, 5, 1, 1, '#000'); R(7, 5, 1, 1, '#000'); R(3, 3, 2, .5, hair); R(7, 3, 2, .5, hair); R(5, 7, 2, 4, '#3a0606'); R(5, 7, 2, 1, '#f0e8e0'); }
  R(10.5, 3, 1, 2, '#9ad0ff'); R(1, 6 + (Math.floor(t * 10) % 3), .6, 1.5, '#9ad0ff'); }
function hsCutDraw(H, g, W, Hh) { const c = H.cut; if (!c) return; const a = (H.t - c.t0) / .95; if (a >= 1) { H.cut = null; return; }
  const bh = Math.round(Math.min(Hh * .46, W * .36)), by = Math.round(Hh / 2 - bh / 2), sl = a < .1 ? a / .1 : a > .82 ? (1 - a) / .18 : 1;
  g.save(); g.globalAlpha = sl; g.fillStyle = 'rgba(4,0,0,.9)'; g.fillRect(0, by, W, bh); g.fillStyle = '#8a0a0a'; g.fillRect(0, by, W, 2); g.fillRect(0, by + bh - 2, W, 2);
  for (let i = 0; i < 16; i++) { const y = by + 4 + ((i * 37 + Math.floor(H.t * 300)) % (bh - 8)); g.fillStyle = 'rgba(170,20,20,.22)'; g.fillRect(0, y, W, 1); }
  const sc = Math.max(2, Math.floor(bh / 15)), shk = a < .5 ? (rnd() - .5) * sc : 0; hsFace(g, c.P, Math.round(W * .22 - 6 * sc + shk), Math.round(by + bh / 2 - 6.5 * sc), sc, c.faint, H.t);
  const k = Math.min(1, a / .16), rx = W * .74 + (1 - k) * W * .5;
  const glow = g.createRadialGradient(rx, by + bh / 2, 2, rx, by + bh / 2, bh * .7); glow.addColorStop(0, 'rgba(200,0,0,.45)'); glow.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = glow; g.fillRect(W * .45, by, W * .55, bh);
  if (c.hero) { const P = HCOS[hCos()].P, s = personSprite(P, 1, 0), h = bh * .95, w = h * 16 / s.height; g.drawImage(stTint(s, P.sil), Math.round(rx - w / 2), Math.round(by + bh - h), Math.round(w), Math.round(h)); g.save(); g.translate(Math.round(rx - w * .3), Math.round(by + bh * .58)); g.scale(h / 26, h / 26); hsWeapon(g, HCOS[hCos()].wp, 0, 0, -2.4 + k * .7); g.restore(); }
  else if (c.gh) { const s = hsGhSnap(c.gh[0], c.gh[1]); if (s) { const h = bh * 1.05, w = h * s.width / s.height; g.drawImage(s, Math.round(rx - w / 2), Math.round(by + bh - h + (1 - k) * 6), Math.round(w), Math.round(h)); } }
  if (a < .07) { g.fillStyle = 'rgba(255,255,255,' + (.7 * (1 - a / .07)).toFixed(2) + ')'; g.fillRect(0, 0, W, Hh); }
  g.restore(); }
function hsCutCss(H) { const c = H.cut; if (!c) return ''; const a = (H.t - c.t0) / .95; if (a >= 1) return ''; const cv = $('#hcv'), wr = $('#hsw'); if (!cv || !wr) return ''; const r = cv.getBoundingClientRect(), rw = wr.getBoundingClientRect();
  return '<div class="hcut-t" style="top:' + Math.round(r.top - rw.top + r.height * .5 + Math.min(r.height * .17, r.width * .12)) + 'px;transform:translateY(-50%) scale(' + (a < .1 ? 1.8 - a * 8 : 1).toFixed(2) + ');opacity:' + (a < .1 ? a * 10 : a > .82 ? (1 - a) / .18 : 1).toFixed(2) + '">' + esc(c.txt) + '</div>'; }

/* —— 6. 屏幕：常驻暗角 + 慢慢飘的雾 —— */
function hsMood(H, g, W, Hh, t) { const gr = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * .32, W / 2, Hh / 2, Math.max(W, Hh) * .72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(6,0,2,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 4; i++) { const x = ((t * (6 + i * 3) + i * 97) % (W + 160)) - 80, y = Hh * (.2 + i * .2) + Math.sin(t * .4 + i) * 10, f = g.createRadialGradient(x, y, 4, x, y, 70); f.addColorStop(0, 'rgba(150,150,170,.06)'); f.addColorStop(1, 'rgba(150,150,170,0)'); g.fillStyle = f; g.fillRect(x - 70, y - 70, 140, 140); } }
