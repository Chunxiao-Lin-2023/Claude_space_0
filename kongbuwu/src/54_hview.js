/* ================= 鬼屋地图：画面、界面、操作 ================= */
Object.assign(SPR, {
  hbush(g, e, t, R) { R(0, 3, 16, 13, '#1a2a18'); R(1, 1, 7, 8, '#22361f'); R(7, 0, 8, 9, '#1e321c'); R(2, 6, 12, 8, '#2a4426'); R(4, 4, 2, 2, '#35552f'); R(10, 3, 2, 2, '#35552f'); if (e.open) { R(5, 8, 1, 1, '#e8e0c8'); R(9, 8, 1, 1, '#e8e0c8'); } },
  urinal(g, e, t, R) { R(4, -4, 8, 14, '#d8dcd8'); R(5, -2, 6, 9, '#b8bcb8'); R(7, 9, 2, 3, '#888'); },
  hhang(g, e, t, R) { R(7, -14, 1, e.on ? 14 : 4, '#8a7a5a'); if (e.on) { const sw = Math.round(Math.sin(t * 6) * 2); R(4 + sw, -1, 8, 4, '#d8d0c8'); R(5 + sw, 3, 6, 8, '#e8e4dc'); R(5 + sw, 11, 2, 4, '#c8c0b8'); R(9 + sw, 11, 2, 4, '#c8c0b8'); R(5 + sw, -1, 6, 2, '#141214'); } else { R(5, -11, 5, 2, '#5a4a3a'); } },
  hwardh(g, e, t, R) { SPR.wardrobe(g, e, t, R); if (e.on) { R(14, 6, 6, 2, '#d8c8b8'); R(18, 5, 2, 4, '#d8c8b8'); R(14, 7, 6, 1, '#8a1010'); } },
  hblood(g, e, t, R) { R(2, 2, 12, 12, 'rgba(0,0,0,.25)'); if (e.on || !e.off) { R(3, 3, 3, 4, '#6a0808'); R(9, 5, 3, 4, '#6a0808'); R(5, 9, 3, 4, '#7a0a0a'); R(4, 7, 1, 5, '#5a0606'); R(10, 9, 1, 5, '#5a0606'); } },
  hcrib(g, e, t, R) { R(1, 4, 14, 1, '#c8b890'); R(1, 12, 14, 2, '#a89870'); for (let x = 1; x < 15; x += 3) R(x, 4, 1, 9, '#b8a880'); R(4, 9, 8, 3, '#e8d8e0'); if (e.on) { R(6, 6, 4, 3, '#f0e0d8'); R(7, 7, 1, 1, '#141214'); R(9, 7, 1, 1, '#141214'); } },
  hspeaker(g, e, t, R) { R(3, -6, 10, 12, '#2a2a2e'); R(4, -5, 8, 10, '#3a3a40'); R(6, -3, 4, 4, '#1a1a1e'); R(7, 2, 2, 2, '#1a1a1e'); if (e.on) R(12, -4, 3, 1, '#e8b04a'); },
  hdolls(g, e, t, R) { R(0, -10, 16, 24, '#4a3020'); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = 1 + c * 5, y = -9 + r * 8; R(x, y, 4, 4, '#e8dcd0'); R(x, y, 4, 1, '#2a1a14'); const d = e.on ? 2 : 0; R(x + 1 + (e.on ? 1 : 0), y + 2, 1, 1, '#141214'); R(x + 2 + d - (e.on ? 1 : 0), y + 2, 1, 1, '#141214'); R(x, y + 4, 4, 3, '#a03838'); } },
  hcoffin(g, e, t, R) { R(2, -2, 12, 18, '#3a2418'); R(3, -1, 10, 16, e.on ? '#0a0606' : '#5a3a28'); R(7, 2, 2, 8, e.on ? '#0a0606' : '#8a6a3a'); R(5, 4, 6, 2, e.on ? '#0a0606' : '#8a6a3a'); if (e.on) { R(5, 2, 6, 5, '#d8d0c8'); R(6, 4, 1, 1, '#a00'); R(9, 4, 1, 1, '#a00'); } },
  bucket(g, e, t, R) { R(4, 6, 8, 9, '#4a6a8a'); R(4, 6, 8, 1, '#6a8aaa'); R(5, 8, 6, 1, '#3a5a7a'); R(3, 4, 10, 1, '#777'); }
});
const HPPL = { 鬼新娘: P_({ skin: '#e8e0dc', hair: '#0a0808', hs: 'long', cover: 1, top: '#a01010', dress: 1, hat: 'veil', hatC: '#c01818', ghost: 1 }), 剪刀狂人: P_({ skin: '#d8c8b8', hair: '#2a2420', hs: 'messy', top: '#7a7a70', coat: 1, bottom: '#3a3a34', redEye: 1 }), 僵尸: P_({ skin: '#8aa080', hair: '#2a2a20', hs: 'messy', top: '#4a5a3a', bottom: '#3a3a30', redEye: 1 }) };
const HF = { dmg: '#ffd27a', crit: '#ff6a4a', bad: '#ff8a8a', txt: '#d8d0c0', staff: '#c8a8ff', sys: '#9cc' };
function hLog(H, s, cls) { H.log.push({ s, cls: cls || '', t: H.t }); if (H.log.length > 40) H.log.shift(); }
function hFloat(H, x, y, s, k) { if (H.txt.length > 24) H.txt.shift(); const n = H.txt.filter(f => H.t - f.t0 < .9 && Math.abs(f.x - x) < 1.6 && Math.abs(f.y0 - y) < 1.2).length; H.txt.push({ x, y: y - n * .6, y0: y, s, k: k || 'txt', t0: H.t }); }
function hBub(H, v, s, dur, big) { v.bub = { s, until: H.t + (dur || 2), big }; }
function hFx(H, k, x, y, sk) { H.fx.push({ k, x, y, sk, t0: H.t }); if (k === 'light') H.black = .9; }

/* ---------- 尺寸 ---------- */
function hsSize() { const H = HS, cv = $('#hcv'), wr = $('#hsw'); if (!H || !cv || !wr) return; const over = H.done && H.mode === 'house';
  const top = over ? null : $('#hsset .hs-st') || $('#hshud .hs-top'), bot = over ? null : $('#hsset .hs-sb') || $('#hshud .hs-bot'), tH = top ? top.offsetHeight : 0, bH = bot ? bot.offsetHeight : 0;
  cv.style.top = tH + 'px'; cv.style.bottom = 'auto'; cv.style.height = Math.max(60, (wr.clientHeight || 520) - tH - bH) + 'px'; const pk = $('#hspick'); if (pk) pk.style.bottom = (bH + 4) + 'px'; const rm = $('#hsroom'), mm = $('#hsside'), tk = $('#hstick'), ct = $('#hsctr'), hn = $('#hshint'); if (rm) rm.style.top = (tH + 4) + 'px'; if (mm) mm.style.top = (tH + 4) + 'px'; if (ct) ct.style.top = (tH + 22) + 'px'; if (hn) hn.style.top = (tH + 60) + 'px'; if (tk) tk.style.bottom = (bH + 6) + 'px';
  const W = wr.clientWidth || 360, Hh = Math.max(120, (wr.clientHeight || 520) - tH - bH);
  if (H.phase === 'setup' || H.done) { cv.width = H.M.w * 16; cv.height = H.M.h * 16; H.z = 0; }
  else { let z = clamp(Math.floor(Math.min(W / (16 * 15), Hh / (16 * 9.5))), 2, 4); if (H.zoomOut) z = Math.max(1, Math.floor(Math.min(W / (H.M.w * 16), Hh / (H.M.h * 16))) || 1, z - 2); cv.width = Math.ceil(W / z); cv.height = Math.ceil(Hh / z); H.z = z; }
  H.cam = H.cam || { x: 0, y: 0 }; hsCam(H, true); }
function hsCam(H, snap) { const cv = $('#hcv'); if (!cv) return; const M = H.M; if (!H.z) { H.cam.x = 0; H.cam.y = 0; return; } if (H.focus && (H.focus.st === 'gone' || H.focus.st === 'wait')) H.focus = null; const f = H.focusPt ? { x: H.focusPt[0], y: H.focusPt[1] } : H.focus || H.hero;
  let tx = f.x * 16 + 8 - cv.width / 2, ty = f.y * 16 - cv.height / 2 + 4; const mw = M.w * 16, mh = M.h * 16; tx = mw <= cv.width ? (mw - cv.width) / 2 : clamp(tx, 0, mw - cv.width); ty = mh <= cv.height ? (mh - cv.height) / 2 : clamp(ty, 0, mh - cv.height);
  if (snap) { H.cam.x = tx; H.cam.y = ty; } else { const k = Math.min(1, H.dt * 8); H.cam.x += (tx - H.cam.x) * k; H.cam.y += (ty - H.cam.y) * k; } }
/* 屏幕坐标 → 地图坐标（格） */
function hsPt(H, ev) { const cv = $('#hcv'), r = cv.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * s) / 2, oy = (r.height - cv.height * s) / 2;
  return [((ev.clientX - r.left - ox) / s + H.cam.x) / 16 - .5, ((ev.clientY - r.top - oy) / s + H.cam.y) / 16 - .5]; }
function hsToCss(H, x, y) { const cv = $('#hcv'), wr = $('#hsw'), r = cv.getBoundingClientRect(), rw = wr.getBoundingClientRect(), s = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * s) / 2 + r.left - rw.left, oy = (r.height - cv.height * s) / 2 + r.top - rw.top;
  return [(x * 16 + 8 - H.cam.x) * s + ox, (y * 16 - H.cam.y) * s + oy, s]; }

/* ---------- 画面 ---------- */
function hsMapCache(M) { if (M.cache) return M.cache; const c = M.cache = mk(M.w * 16, M.h * 16), g = c.getContext('2d'); const D = M.D, st = Object.assign({}, WALLSTYLE[D.wall] || WALLSTYLE.paper, D.wallC || {}), opts = D.tileOpts || {};
  const isW = (x, y) => x < 0 || y < 0 || x >= M.w || y >= M.h || M.t[y * M.w + x] === 'wall' || M.t[y * M.w + x] === 'void';
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) { const R = (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x * 16 + Math.floor(a), y * 16 + Math.floor(b), Math.ceil(w), Math.ceil(h)); }; const n = M.t[y * M.w + x];
    if (n === 'wall') paintWall(R, x, y, !isW(x, y + 1), st, isW); else if (TILE[n]) TILE[n].paint(R, x, y, opts); else R(0, 0, 16, 16, '#000');
    if (M.sec[y * M.w + x]) { R(0, 0, 16, 16, 'rgba(10,6,6,.55)'); R(3, 2, 10, 12, 'rgba(0,0,0,.5)'); } }
  for (const e of M.ents) if (e.flat || e.wall) hsSpr(g, e, 0, 0, 0); return c; }
function hsSpr(g, e, ox, oy, t) { const fn = SPR[e.spr]; if (!fn) return; const x = Math.round(e.x * 16 - ox), y = Math.round(e.y * 16 - oy); fn(g, e, t, (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x + Math.floor(a), y + Math.floor(b), Math.ceil(w), Math.ceil(h)); }); }
function hsPerson(g, P, x, y, dir, fr, alpha) { const s = personSprite(P, dir, fr), tl = P.tall || 1, h = Math.round(24 * tl); g.globalAlpha = alpha ?? 1; g.drawImage(stTint(s, P.sil), Math.round(x), Math.round(y + 16 - h), 16, h); g.globalAlpha = 1; }
const HLC = mk(8, 8);
/* 被吓到的游客：按姿势画（跳起来 / 摔坐 / 发抖 / 捂眼 / 哭），跑的时候一颠一颠、甩汗（RULES 29） */
function hsPose(H, v) { const t = H.t, a = t - (v.poseT ?? -9), on = v.st === 'react' || (v.st === 'flee' && v.fleeWait > 0); if (!on) return v.st === 'run' || v.st === 'flee' ? { dy: Math.floor(t * 12) % 2 ? -1 : 0, sweat: 1 } : t < (v.shaky || 0) ? { dx: Math.floor(t * 9) % 3 === 0 ? 1 : 0 } : null;
  const sh = Math.floor(t * 30) % 2 ? 1 : -1;
  switch (v.pose) { case 'jump': return { dy: -Math.round(Math.abs(Math.sin(Math.min(1, a / .4) * Math.PI)) * 11 + (a > .4 ? Math.abs(Math.sin(a * 14)) * 1.5 : 0)), dx: a > .4 ? sh * .5 : 0 };
    case 'fall': return { sq: .62, dx: a < .15 ? sh : 0 }; case 'shake': return { dx: sh }; case 'cover': return { sq: .8, dx: sh * .5, cover: 1 }; case 'cry': return { dx: sh * .5, tears: 1 }; } return null; }
/* 头上的表情：白色小气泡里一个像素符号（不用 emoji：有的手机/浏览器没有 emoji 字体） */
const HEMO = { '!!': ['#d02020', '.#..#..|.#..#..|.#..#..|.......|.#..#..'], '!!!': ['#d02020', '#.#.#..|#.#.#..|#.#.#..|.......|#.#.#..'], sweat: ['#3a8ad8', '...#...|..###..|.#####.|.#####.|..###..'],
  '?!': ['#d87a10', '###..#.|..#..#.|.##..#.|.......|.#...#.'], xx: ['#5a3030', '#.#.#.#|.#...#.|#.#.#.#|.......|.......'], TT: ['#3a7ad0', '###.###|.#...#.|.#...#.|.#...#.|.#...#.'] };
function hsEmo(g, k, x, y, age) { const E = HEMO[k]; if (!E) return; const pop = age < .18 ? Math.round((1 - age / .18) * 3) : 0, X = Math.round(x), Y = Math.round(y - 9 + pop);
  g.fillStyle = '#1a1414'; g.fillRect(X - 1, Y, 11, 9); g.fillRect(X, Y - 1, 9, 11); g.fillStyle = '#f4f0e6'; g.fillRect(X, Y, 9, 9); g.fillRect(X + 1, Y + 9, 2, 1); g.fillStyle = '#1a1414'; g.fillRect(X, Y + 10, 1, 1);
  g.fillStyle = E[0]; E[1].split('|').forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') g.fillRect(X + 1 + i, Y + 2 + j, 1, 1); }); }
function hsPersonPose(g, P, x, y, dir, fr, po, t, alpha) { if (!po) return hsPerson(g, P, x, y, dir, fr, alpha); const s = personSprite(P, po.sq || po.cover || po.tears ? 0 : dir, po.sq ? 0 : fr), tl = P.tall || 1, h = Math.round(24 * tl * (po.sq || 1)), X = Math.round(x + (po.dx || 0)), Y = Math.round(y + 16 - h + (po.dy || 0));
  g.globalAlpha = alpha ?? 1; g.drawImage(stTint(s, P.sil), X, Y, 16, h); g.globalAlpha = 1;
  if (po.cover) { g.fillStyle = P.skin || '#e8d0b8'; g.fillRect(X + 4, Y + 4, 3, 2); g.fillRect(X + 9, Y + 4, 3, 2); }
  if (po.tears) { g.fillStyle = '#8ac8ff'; const k = Math.floor(t * 8) % 4; g.fillRect(X + 5, Y + 7 + k, 1, 1); g.fillRect(X + 10, Y + 7 + (k + 2) % 4, 1, 1); }
  if (po.sweat) { g.fillStyle = 'rgba(160,210,255,.9)'; const k = Math.floor(t * 6) % 3; g.fillRect(X + (dir === 1 ? 14 : 1) , Y + 2 + k, 1, 2); }
  if (po.sq === .62) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + 2, Y + h - 1, 12, 1); } }
/* 整张图先画在一块和地图一样大的画布上（主画面、监控小窗都从这里裁） */
function hsWorld(H) { const M = H.M, t = H.t; if (!H.world) H.world = mk(M.w * 16, M.h * 16); const g = H.world.getContext('2d'), W = H.world.width, Hh = H.world.height; g.imageSmoothingEnabled = false; const ox = 0, oy = 0;
  g.fillStyle = '#050405'; g.fillRect(0, 0, W, Hh); g.drawImage(hsMapCache(M), 0, 0);
  const setup = H.phase === 'setup';
  /* 机关位 */
  for (const s of M.slots) { const x = s.x * 16 - ox, y = s.y * 16 - oy; if (setup) { const k = (H.lay && H.lay.slots[s.i]) || ''; g.strokeStyle = k ? '#e8b04a' : 'rgba(232,200,120,.55)'; g.setLineDash([2, 2]); g.beginPath(); g.arc(x + 8, y + 8, 7, 0, 7); g.stroke(); g.setLineDash([]); if (k || s.sp) hsDevDraw(g, H, s, k || s.k, ox, oy, t, true); }
    else if (s.k) hsDevDraw(g, H, s, s.k, ox, oy, t); }
  if (setup) for (const s of M.staff) { const k = H.lay && H.lay.staff[s.i]; const x = s.x * 16 - ox, y = s.y * 16 - oy; g.strokeStyle = k ? '#b090ff' : 'rgba(180,150,255,.5)'; g.setLineDash([2, 2]); g.strokeRect(x + 2.5, y - 5.5, 11, 20); g.setLineDash([]); if (k) hsPerson(g, pplOf(PETS[k].n === '殷小小' ? '小小' : PETS[k].n), x, y, 0, 0, .9); }
  if (H.tags) for (const tg of H.tags) { const x = tg[0] * 16 - ox, y = tg[1] * 16 - oy; g.fillStyle = '#d8d0b0'; g.fillRect(x + 5, y + 6, 6, 4); g.fillStyle = '#2a4a8a'; g.fillRect(x + 5, y + 6, 6, 1); }
  if (H.item && !H.item.got) { const x = H.item.x * 16 - ox, y = H.item.y * 16 - oy, b = Math.sin(t * 5) * 1.5; hsSpr(g, { spr: 'sparkle', x: H.item.x, y: H.item.y - .1 + b / 16 }, ox, oy, t); g.fillStyle = '#f0d890'; g.fillRect(x + 6, y + 5 + b, 4, 5); }
  /* 按 y 排序：摆设、游客、员工、陈歌、追的东西 */
  const L = []; for (const e of M.ents) if (!e.flat && !e.wall) L.push([e.y + e.h - 1, 0, e]);
  if (!setup) { for (const v of H.vis) if (v.st !== 'wait' && v.st !== 'gone') { L.push([v.y, 1, v]); v.fol.forEach(f => { const tr = v.ftrail[f.lag] || v.ftrail[v.ftrail.length - 1]; if (tr) L.push([tr[1] - .01, 3, { f, tr, v }]); }); }
    for (const s of H.staff) L.push([s.y, 2, s]); L.push([H.hero.y + .01, 4, H.hero]); if (H.boss) L.push([H.boss.y, 5, H.boss]); }
  L.sort((a, b) => a[0] - b[0]);
  for (const [, k, o] of L) {
    if (k === 0) { if (o.hide && H.hero.hidden && H.hero.tx === o.x && H.hero.ty === o.y && !setup) { hsSpr(g, Object.assign({}, o, { open: (t * 2 % 3) < .4 }), ox, oy, t); const x = o.x * 16 - ox, y = o.y * 16 - oy; g.fillStyle = '#e8e0c8'; g.fillRect(x + 5, y - 2, 1, 1); g.fillRect(x + 9, y - 2, 1, 1); } else hsSpr(g, o, ox, oy, t); }
    else if (k === 1) hsPersonPose(g, o.P, o.x * 16 - ox, o.y * 16 - oy, o.dir, o.mv ? o.fr : 0, hsPose(H, o), t);
    else if (k === 3) hsPersonPose(g, o.f.P, o.tr[0] * 16 - ox + 3, o.tr[1] * 16 - oy + 1, o.tr[2], o.tr[3], hsPose(H, o.v), t + .13, .95);
    else if (k === 2) { const pop = o.pop > 0; hsPerson(g, o.P, o.x * 16 - ox, o.y * 16 - oy, pop ? (o.px < o.home[0] ? 1 : o.px > o.home[0] ? 2 : 0) : 0, 0, o.off ? .15 : pop ? 1 : .42); }
    else if (k === 4) { if (!o.hidden) hsPerson(g, o.P, o.x * 16 - ox, o.y * 16 - oy, o.dir, o.mv ? o.fr : 0); }
    else if (k === 5) hsPerson(g, o.P, o.x * 16 - ox + (o.hunt ? (rnd() - .5) * 1.5 : 0), o.y * 16 - oy, o.dir, o.mv ? o.fr : 0, o.ghost ? .88 : 1); }
  /* 黑暗 */ if (!setup) hsDark(H, g, ox, oy);
  else { g.fillStyle = 'rgba(5,4,8,.28)'; g.fillRect(0, 0, W, Hh); }
  /* 黑暗之上：机关圈、胆量条、气泡标记 */
  if (!setup) {
    if (H.mode === 'house') for (const s of M.slots) { if (!s.k) continue; const x = s.x * 16 + 8 - ox, y = s.y * 16 + 8 - oy, inr = hDevInRange(H, s), rdy = hDevReady(H, s), tg = rdy && inr && hDevTargets(H, s).length;
      if (tg) { const p = .6 + Math.sin(t * 9) * .4; g.strokeStyle = `rgba(255,70,50,${p})`; g.lineWidth = 1; g.beginPath(); g.arc(x, y, (HB.zone + .5) * 16, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,60,40,.12)'; g.fill(); }
      else if (inr) { g.strokeStyle = rdy ? 'rgba(232,176,74,.55)' : 'rgba(150,150,150,.3)'; g.setLineDash([2, 3]); g.beginPath(); g.arc(x, y, (HB.zone + .5) * 16, 0, 7); g.stroke(); g.setLineDash([]); }
      g.fillStyle = rdy ? (inr ? '#e8b04a' : 'rgba(232,176,74,.5)') : '#555'; g.fillRect(x - 1, y - 12, 2, 2); if (s.cd > 0) { g.fillStyle = '#e8b04a'; g.fillRect(x - 6, y + 9, Math.round(12 * (1 - s.cd / HB.devCd)), 1); } }
    for (const v of H.vis) { if (v.st === 'wait' || v.st === 'gone') continue; const x = v.x * 16 - ox, y = v.y * 16 - oy - (v.P.tall ? 14 : 10), r = Math.max(0, v.u.hp / v.u.mhp); if (v.st !== 'flee') { g.fillStyle = '#1a0a0a'; g.fillRect(x + 1, y - 3, 14, 3); g.fillStyle = r < .3 ? '#ff5a3a' : r < .6 ? '#e8b04a' : '#9ad0a0'; g.fillRect(x + 2, y - 2, Math.ceil(12 * r), 1); if (v.u.charging || (v.u.intent && v.u.intent.charge)) { g.fillStyle = '#ff3a2a'; g.fillRect(x + 7, y - 9, 2, 4); g.fillRect(x + 7, y - 4, 2, 1); } if (v.u.picky) { g.fillStyle = '#e8b04a'; g.fillRect(x + 13, y - 6, 2, 2); } if (H.hero.chase === v) { g.strokeStyle = '#ff5a3a'; g.strokeRect(x + .5, y + 3.5, 15, 22); } } }
    for (const v of H.vis) if (v.emo && v.emo.until > t && v.st !== 'gone' && v.st !== 'wait') hsEmo(g, v.emo.s, v.x * 16 - ox + 11, v.y * 16 - oy - (v.P.tall ? 20 : 16), t - (v.poseT ?? t));
    if (H.hero.hidden) { const x = H.hero.x * 16 - ox, y = H.hero.y * 16 - oy; g.fillStyle = 'rgba(232,224,200,.9)'; g.fillRect(x + 5, y - 2, 1, 1); g.fillRect(x + 9, y - 2, 1, 1); }
    if (H.hero.path && !H.hero.chase) { const [px, py] = H.hero.path, x = px * 16 + 8 - ox, y = py * 16 + 8 - oy; g.strokeStyle = 'rgba(160,220,200,.6)'; g.beginPath(); g.arc(x, y, 3 + Math.sin(t * 8), 0, 7); g.stroke(); } }
  hsFxDraw(H, g, ox, oy);
  }
function hsDevDraw(g, H, s, k, ox, oy, t, setup) { const D = hDev(k); if (!D) return; const on = s.fx > 0;
  if (D.P) { const P = HPPL[D.P] || pplOf(D.P); hsPerson(g, P, s.x * 16 - ox, s.y * 16 - oy - (on ? 2 : 0), 0, 0, setup ? .8 : on ? 1 : .28); return; }
  hsSpr(g, { spr: on && k === 'jump' ? 'closet' : D.spr, x: s.x, y: s.y, open: on ? 1 : 0, off: !setup && s.cd > 0 ? 1 : 0, power: k === 'friday' ? 'static' : 0, lit: 1, on }, ox, oy, t); }
/* 组合到屏幕：裁主画面，加上屏幕效果和边缘箭头 */
function hsDraw(H) { const cv = $('#hcv'); if (!cv) return; hsWorld(H); const g = cv.getContext('2d'), t = H.t, W = cv.width, Hh = cv.height; g.imageSmoothingEnabled = false;
  let sx = 0, sy = 0; if (H.shake > 0) { sx = (rnd() - .5) * 6 * H.shake * 4; sy = (rnd() - .5) * 4 * H.shake * 4; } g.fillStyle = '#050405'; g.fillRect(0, 0, W, Hh); g.drawImage(H.world, -Math.round(H.cam.x + sx), -Math.round(H.cam.y + sy));
  if (H.black > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(.92, H.black) * (Math.floor(t * 20) % 3 ? 1 : .6)})`; g.fillRect(0, 0, W, Hh); }
  if (H.red > 0) { g.fillStyle = `rgba(150,0,0,${H.red * .28})`; g.fillRect(0, 0, W, Hh); }
  if (H.phase === 'live' && !H.done) hsArrows(H, g, W, Hh);
  if (H.heart > .05) { const gr = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * .25, W / 2, Hh / 2, Math.max(W, Hh) * .7); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(140,0,0,${H.heart * .55 * (.75 + Math.sin(t * 9) * .25)})`); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
  for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect((rnd() * W) | 0, (rnd() * Hh) | 0, 1, 1); } }
/* 画面外的游客（红）和已经能拉的机关（黄）：屏幕边缘的小箭头 */
function hsArrows(H, g, W, Hh) { const pts = []; for (const v of hActive(H)) pts.push([v.x, v.y, '#ff4a3a']); if (H.mode === 'house') for (const s of H.M.slots) if (s.armed) pts.push([s.x, s.y, '#f0c050']); if (H.boss && H.boss.hunt) pts.push([H.boss.x, H.boss.y, '#ff2020']);
  const cx = W / 2, cy = Hh / 2; for (const [x, y, col] of pts) { const px = x * 16 + 8 - H.cam.x, py = y * 16 + 4 - H.cam.y; if (px > 4 && px < W - 4 && py > 4 && py < Hh - 4) continue; const dx = px - cx, dy = py - cy, k = Math.min((W / 2 - 7) / Math.abs(dx || 1e-3), (Hh / 2 - 7) / Math.abs(dy || 1e-3)), ax = cx + dx * k, ay = cy + dy * k, an = Math.atan2(dy, dx);
    g.save(); g.translate(Math.round(ax), Math.round(ay)); g.rotate(an); g.globalAlpha = .65 + Math.sin(H.t * 8) * .3; g.fillStyle = col; g.beginPath(); g.moveTo(5, 0); g.lineTo(-3, -4); g.lineTo(-3, 4); g.closePath(); g.fill(); g.restore(); } g.globalAlpha = 1; }
let HDK = null;
function hsDark(H, g, ox, oy) { const M = H.M, W = g.canvas.width, Hh = g.canvas.height; if (!HDK || HDK.width !== W || HDK.height !== Hh) HDK = mk(W, Hh); const L = HDK.getContext('2d'); L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, Hh);
  L.globalAlpha = M.D.dark; L.fillStyle = '#04030a'; L.fillRect(0, 0, W, Hh); L.globalAlpha = 1; L.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { if (r <= 0) return; const gr = L.createRadialGradient(x, y, r * .12, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.6, `rgba(0,0,0,${a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.beginPath(); L.arc(x, y, r, 0, 7); L.fill(); };
  const warm = [], P = (o, dy) => [o.x * 16 + 8 - ox, o.y * 16 + (dy ?? 4) - oy];
  const h = H.hero; if (!h.hidden) hole(...P(h), (H.mode === 'chase' ? 3.2 : 2.3) * 16, H.mode === 'chase' ? .95 : .62); else hole(...P(h), 1.2 * 16, .35);
  for (const e of M.ents) if (e.light) { const fl = 1 + Math.sin(H.t * 11 + e.x) * .05 + (rnd() < .015 ? -.35 : 0); const [x, y] = P(e, 6); hole(x, y, e.light[0] * 16 * fl, .9); warm.push([x, y, e.light[0] * 16, e.light[1]]); }
  for (const v of H.vis) { if (v.st === 'wait' || v.st === 'gone' || v.u.st.dark) continue; const [x, y] = P(v); hole(x, y, v.light * 16, .85); if (v.light > 2) { const [dx, dy] = HD[v.dir]; hole(x + dx * 30, y + dy * 30, 2.4 * 16, .7); } }
  for (const s of M.slots) if (s.fx > 0) { const [x, y] = P(s, 8); hole(x, y, 3 * 16 * s.fx, .9); warm.push([x, y, 3 * 16 * s.fx, 'rgba(255,40,30,.3)']); }
  for (const s of H.staff) if (s.pop > 0) { const [x, y] = P(s); hole(x, y, 2 * 16, .7); }
  if (H.boss) { const [x, y] = P(H.boss); hole(x, y, 1.2 * 16, .5); warm.push([x, y, 2 * 16, 'rgba(160,0,0,.25)']); }
  if (H.item && !H.item.got) { const [x, y] = P(H.item, 8); hole(x, y, 1.6 * 16, .8); warm.push([x, y, 1.6 * 16, 'rgba(255,230,140,.2)']); }
  L.globalCompositeOperation = 'source-over'; g.drawImage(HDK, 0, 0);
  if (warm.length) { g.globalCompositeOperation = 'lighter'; for (const [x, y, r, col] of warm) { const gr = g.createRadialGradient(x, y, 0, x, y, r * .8); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * .8, 0, 7); g.fill(); } g.globalCompositeOperation = 'source-over'; } }
/* 机关和员工的像素动画 */
const HGHOST = { jump: P_({ sil: '#5a0606', hs: 'long', cover: 1, redEye: 1, dress: 1, top: '#700', ghost: 1 }), doll: P_({ skin: '#e8e4dc', hair: '#141214', hs: 'bob', top: '#c8c0b0', dress: 1, mask: 1, ghost: 1 }) };
function hsFxDraw(H, g, ox, oy) { for (let i = H.fx.length - 1; i >= 0; i--) { const f = H.fx[i], a = (H.t - f.t0) / .9; if (a >= 1) { H.fx.splice(i, 1); continue; } const x = f.x * 16 + 8 - ox, y = f.y * 16 + 8 - oy;
    if (f.k === 'jump' || f.k === 'pounce' && f.sk === 'jump') { const k = 1.2 + Math.min(1, a * 4) * .8, P = HGHOST.jump; g.fillStyle = `rgba(120,0,0,${(1 - a) * .35})`; g.fillRect(x - 40, y - 40, 80, 80); g.globalAlpha = 1 - a * .6; g.drawImage(personSprite(P, 0, 0), 0, 0, 16, 14, Math.round(x - 8 * k * 1.6), Math.round(y - 26 * k + (1 - a) * 6), Math.round(16 * k * 1.6), Math.round(14 * k * 1.6)); g.globalAlpha = 1; }
    else if (f.k === 'sound') { for (let r = 0; r < 3; r++) { const rr = ((a * 3 + r) % 3) / 3; g.strokeStyle = `rgba(200,160,255,${(1 - rr) * .7})`; g.beginPath(); g.arc(x, y, 4 + rr * 40, 0, 7); g.stroke(); } }
    else if (f.k === 'doll') { const P = HGHOST.doll, k = 1 + Math.min(1, a * 3) * .7; g.globalAlpha = 1 - a * .5; g.drawImage(personSprite(P, a > .5 ? 2 : 0, 0), Math.round(x - 8 * k), Math.round(y - 26 * k), Math.round(16 * k), Math.round(24 * k)); g.globalAlpha = 1; }
    else if (f.k === 'story') { g.fillStyle = `rgba(160,200,180,${(1 - a) * .5})`; for (let j = 0; j < 6; j++) { const an = j + a * 3; g.fillRect(Math.round(x + Math.cos(an) * (8 + a * 22)), Math.round(y + Math.sin(an) * (6 + a * 14)), 2, 2); } }
    else if (f.k === 'chase' || f.k === 'pounce') { g.strokeStyle = `rgba(255,60,40,${1 - a})`; for (let j = 0; j < 5; j++) { const yy = y - 10 + j * 5; g.beginPath(); g.moveTo(x - 16 - a * 10, yy); g.lineTo(x - 4, yy); g.stroke(); } g.fillStyle = `rgba(255,80,60,${(1 - a) * .5})`; g.fillRect(x - 3, y - 14, 6, 6); }
    else if (f.k === 'staff') { g.fillStyle = `rgba(190,150,255,${(1 - a) * .6})`; for (let j = 0; j < 8; j++) { const an = j / 8 * 6.28; g.fillRect(Math.round(x + Math.cos(an) * a * 18), Math.round(y - 6 + Math.sin(an) * a * 14), 2, 2); } }
    else if (f.k === 'hang') { const dy = Math.min(1, a * 5) * 18, sw = Math.sin(H.t * 7) * 3; g.fillStyle = '#8a7a5a'; g.fillRect(x, y - 40, 1, 22 + dy); g.globalAlpha = 1 - a * .4; g.drawImage(personSprite(HGHOST.hang || (HGHOST.hang = P_({ skin: '#d8d0c8', hair: '#141214', hs: 'long', cover: 1, top: '#e8e4dc', dress: 1, ghost: 1 })), 0, 0), Math.round(x - 12 + sw), Math.round(y - 40 + dy), 24, 36); g.globalAlpha = 1; }
    else if (f.k === 'hand') { const k = Math.min(1, a * 5); g.fillStyle = '#d8c8b8'; g.fillRect(Math.round(x - 4), Math.round(y + 2), Math.round(10 + k * 12), 3); for (let j = 0; j < 4; j++) g.fillRect(Math.round(x + 6 + k * 12), Math.round(y - 1 + j * 2), 4, 1); g.fillStyle = `rgba(120,0,0,${(1 - a) * .3})`; g.fillRect(x - 30, y - 20, 60, 40); }
    else if (f.k === 'blood') { g.fillStyle = `rgba(110,6,6,${1 - a * .5})`; for (let j = 0; j < 9; j++) { const hx = x + (hash(j, 3, f.t0 * 9 | 0) - .5) * 44, hy = y - 20 + (hash(j, 5, 7) - .5) * 26; if (a * 9 > j) { g.fillRect(Math.round(hx), Math.round(hy), 4, 5); g.fillRect(Math.round(hx + 1), Math.round(hy + 5), 1, Math.round(a * 10)); } } }
    else if (f.k === 'coffin' || f.k === 'bride' || f.k === 'zombie') { const P = f.k === 'bride' ? HPPL.鬼新娘 : f.k === 'zombie' ? HPPL.僵尸 : HGHOST.jump, k = 1.3 + Math.min(1, a * 4) * .9; g.fillStyle = `rgba(120,0,0,${(1 - a) * .35})`; g.fillRect(x - 44, y - 44, 88, 88); g.globalAlpha = 1 - a * .5; const n = f.k === 'zombie' ? 3 : 1; for (let j = 0; j < n; j++) g.drawImage(personSprite(P, 0, j % 2), 0, 0, 16, 14, Math.round(x - 8 * k * 1.5 + (j - (n - 1) / 2) * 18), Math.round(y - 24 * k + (1 - a) * 8), Math.round(16 * k * 1.5), Math.round(14 * k * 1.5)); g.globalAlpha = 1; }
    else if (f.k === 'light') { g.fillStyle = `rgba(255,255,255,${a < .1 ? .7 : 0})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height); } } }

/* ---------- 文字层（飘字、气泡） ---------- */
function hsTextLayer(H) { const el = $('#hsfx'); if (!el) return; let h = ''; const now = H.t;
  for (const f of H.txt) { const a = (now - f.t0) / 1.3; if (a >= 1) continue; const [x, y] = hsToCss(H, f.x, f.y - a * .8); h += '<span class="hf ' + f.k + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;opacity:' + (1 - a * a).toFixed(2) + '">' + esc(f.s) + '</span>'; }
  H.txt = H.txt.filter(f => now - f.t0 < 1.3);
  if (H.phase === 'setup' && H.lay) { for (const s of H.M.slots) { const k = s.sp ? s.k : H.lay.slots[s.i], [x, y] = hsToCss(H, s.x, s.y + .5); h += '<span class="hl' + (k ? ' on' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + (k ? hDev(k).ic : '') + s.n + '</span>'; }
    for (const s of H.M.staff) { const k = H.lay.staff[s.i], [x, y] = hsToCss(H, s.x, s.y - .9); h += '<span class="hl st' + (k ? ' on' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + (k ? esc(PETS[k].n) : '员工') + '</span>'; }
    for (const r of H.M.rooms) { const [x, y] = hsToCss(H, (r.x0 + r.x1) / 2, r.y0 + .1); h += '<span class="hr" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + esc(r.n) + '</span>'; } }
  if (H.phase === 'live') { const bub = (o, s, big) => { const [x, y] = hsToCss(H, o.x, o.y - ((o.P && o.P.tall) ? 2.4 : 1.8)); h += '<span class="hb' + (big ? ' big' : '') + '" style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px">' + esc(s) + '</span>'; };
    for (const v of H.vis) if (v.bub && v.st !== 'gone' && v.st !== 'wait') bub(v, v.bub.s, v.bub.big);
 if (H.boss && H.boss.bub && H.boss.bub.until > now) bub(H.boss, H.boss.bub.s, 1); }
  el.innerHTML = h; }

/* ---------- 界面：布置 ---------- */
function hsSetup(H) { H.phase = 'setup'; H.lay = JSON.parse(JSON.stringify(houseLayout(H.o.scene, H.M))); hsSetupHtml(H); H.last = performance.now(); cancelAnimationFrame(H.raf); H.raf = requestAnimationFrame(hsFrame); }
function hsSetupHtml(H) { const B = H.B, el = $('#hsset'), devN = Object.entries(H.lay.slots).filter(([i, k]) => k && !(H.M.slots[i] || {}).sp).length, stN = Object.values(H.lay.staff).filter(Boolean).length;
  const vis = B.foes.map(f => { const cd = C.codex[f.id] || { wk: [] }; return '<span class="hv">' + esc(f.n) + (f.trait ? '<small>' + esc(TRAITS[f.trait].split('：')[0]) + '</small>' : '') + (cd.wk.length ? '<small class="wk">怕' + cd.wk.map(w => EL[w]).join('、') + '</small>' : '<small>弱点未知</small>') + (f.picky ? '<small class="pk">最怕' + EL[f.picky] + '</small>' : '') + '</span>'; }).join('');
  const P = scenePas(H.o.scene);
  el.innerHTML = '<div class="hs-st"><b>' + esc(H.M.D.n) + '</b> · ' + (H.o.ppl || B.foes.length) + ' 位游客<div class="hvs">' + vis + '</div>' + (P.t ? '<div class="hs-rule">场景：' + esc(P.t) + '</div>' : '') + (H.rule ? '<div class="hs-rule red">💡 ' + esc(H.rule.t) + '</div>' : '') + '</div>'
    + '<div class="hs-sb"><div class="hs-cnt">机关 ' + devN + '/' + houseMaxDev() + ' · 员工 ' + stN + '/' + Math.min(H.M.staff.length, houseStaffList().length) + '<small>点圆圈放机关，点人形框安排员工</small></div><button class="btn" onclick="hsCancel()">‹ 不接了</button><button class="btn" onclick="hsAutoLay()">自动布置</button><button class="btn pri big" onclick="hsOpen()">开门营业</button></div><div id="hspick"></div>'; hsSize(); }
/* 暂停 / 退出（RULES 23） */
function hsPause(on) { const H = HS; if (!H || H.done) return; H.paused = on ?? !H.paused; sfx('tap'); let el = $('#hspause'); if (!H.paused) { if (el) el.remove(); H.last = performance.now(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'hspause'; $('#hsw').appendChild(el); }
  el.innerHTML = '<div class="hs-end"><div class="c1">暂停</div><div class="mini" style="margin-bottom:12px">' + (H.mode === 'house' ? '游客还在里面等着。' : '它也停下了。') + '</div><div class="hp-l"><button class="btn pri big" onclick="hsPause(false)">继续</button><button class="btn" onclick="openModal(\'set\')">⚙ 设置</button><button class="btn red" onclick="hsQuit()">' + (H.mode === 'house' ? '提前收工（这批算没吓到）' : '不躲了，回头跟它打（算被追上）') + '</button></div></div>'; }
function hsQuit() { const H = HS; if (!H || H.done) return; const el = $('#hspause'); if (el) el.remove(); H.paused = false;
  if (H.mode === 'house') { H.lost = '你提前收工了。游客们莫名其妙地走了出去。'; for (const v of H.vis) if (v.st !== 'flee') v.st = 'gone'; hLog(H, '提前收工。', 'warn'); hsEnd(H); } else { H.res = 'caught'; hLog(H, '你停下脚步，转过身。', 'warn'); hsEnd(H); } }
function hsCancel() { const H = HS; if (!H || H.phase !== 'setup') return; H.res = 'cancel'; H.done = true; hsClear(); STATE.house = null; HS = null; applyMode(); musicMode(moodNow()); sfx('tap'); hsResolve('cancel'); }
function hsAutoLay() { const H = HS; if (!H) return; H.lay = houseAutoLayout(H.o.scene, H.M); sfx('tap'); hsSetupHtml(H); }
function hsPickSlot(H, s, staff) { const el = $('#hspick'); if (!el) return; const cur = staff ? H.lay.staff[s.i] : H.lay.slots[s.i]; let h = '<div class="hp-h">' + (staff ? '员工位 ' + (s.i + 1) : s.n + ' 号机关位 · ' + esc((hmRoomAt(H.M, s.x, s.y) || {}).n || '')) + '<button class="x" onclick="hsPickClose()">×</button></div><div class="hp-l">';
  if (staff) { for (const k of houseStaffList()) { const used = Object.entries(H.lay.staff).find(([i, v]) => v === k && +i !== s.i); const mv = petMoves(k).filter(m => m.c === 'atk')[0]; h += '<button class="hp-i' + (cur === k ? ' on' : '') + '" onclick="hsSetPick(' + s.i + ',\'' + k + '\',1)"><b>' + esc(PETS[k].n) + '</b><small>' + (mv ? esc(mv.n) + ' · ' + (EL[mv.el] || '') : '') + (used ? ' · 从 ' + (+used[0] + 1) + ' 号位换过来' : '') + '</small></button>'; } if (!houseStaffList().length) h += '<div class="mini">还没有能在白天帮忙的员工。</div>'; }
  else if (s.sp) { const D = hDev(s.k); h += '<div class="mini" style="padding:6px 2px">' + D.ic + ' <b>' + esc(D.n) + '</b>：这个场景自带的机关，一直在这里。' + esc(D.d || '') + (D.remote ? '（电控，在哪都能拉）' : '') + '</div>'; } else { const devs = houseDevices(), lay = H.lay.slots; for (const k of devs) { const S = hDev(k), n = Object.entries(lay).filter(([i, v]) => v === k && +i !== s.i).length, lim = k === 'jump' ? 2 : 1; h += '<button class="hp-i' + (cur === k ? ' on' : '') + (n >= lim ? ' dim' : '') + '" onclick="hsSetPick(' + s.i + ',\'' + k + '\',0)"><b>' + S.ic + ' ' + esc(S.n) + '</b><small>' + EL[S.el] + (S.all ? ' · 范围' : ' · 单个') + (S.st ? ' · ' + ({ fear: '恐惧', vuln: '破绽', dark: '漆黑', mark: '印记', slow: '走不动' })[S.st[0]] : '') + (S.remote ? ' · 📡电控' : '') + (n >= lim ? ' · 已经放满' : '') + '</small></button>'; } }
  if (!s.sp) h += '<button class="hp-i" onclick="hsSetPick(' + s.i + ',\'\',' + (staff ? 1 : 0) + ')"><b>空着</b></button>'; if (!staff && !s.sp && Object.keys(HDEV).some(k => HDEV[k].price && !(C.hh.dev || {})[k])) h += '<div class="mini" style="padding:4px 2px">更多机关在总控制室「道具采购」。</div>'; h += '</div>'; el.innerHTML = h; el.classList.add('on'); $('#hsset').classList.add('picking'); }
function hsPickClose() { const el = $('#hspick'); if (el) el.classList.remove('on'); const s = $('#hsset'); if (s) s.classList.remove('picking'); }
function hsSetPick(i, k, staff) { const H = HS; if (!H) return; if (staff) { for (const j in H.lay.staff) if (H.lay.staff[j] === k) delete H.lay.staff[j]; if (k) H.lay.staff[i] = k; else delete H.lay.staff[i]; }
  else { const lay = H.lay.slots; if (k) { const n = Object.entries(lay).filter(([j, v]) => v === k && +j !== i).length; if (n >= (k === 'jump' ? 2 : 1)) { const j = Object.keys(lay).find(q => lay[q] === k && +q !== i); delete lay[j]; } if (!lay[i] && Object.values(lay).filter(Boolean).length >= houseMaxDev()) { toast('最多放 ' + houseMaxDev() + ' 个机关（等级越高越多）'); return; } lay[i] = k; } else delete lay[i]; }
  sfx('tap'); hsPickClose(); hsSetupHtml(H); }
function hsOpen() { const H = HS; if (!H || H.phase !== 'setup') return; C.hh.lay[H.o.scene] = Object.assign({ v: 1, nd: houseDevices().length, mx: houseMaxDev(), ns: houseStaffList().length }, JSON.parse(JSON.stringify(H.lay))); $('#hsset').innerHTML = ''; $('#hsset').classList.remove('picking'); houseStart(H); hsHud(H); sfx('ok'); }

/* ---------- 界面：开门以后 ---------- */
function hsHud(H) { const el = $('#hshud'); if (!el) return; const chase = H.mode === 'chase';
  el.innerHTML = '<div class="hs-top">' + (chase ? '<span class="hs-obj" id="hsobj"></span>' : '<div class="hs-atm"><i id="hsatm"></i><span id="hsatt"></span></div><span class="hs-k" id="hsk"></span>') + '<span class="hs-mp" id="hsmp"></span>' + (chase ? '' : '<button class="tb" id="hsauto" onclick="hsAuto()">🤖</button>') + '<button class="tb" id="hszoom" onclick="hsZoom()">🔍</button><button class="tb" onclick="hsPause()" aria-label="暂停">⏸</button></div>'
    + '<div class="hs-room" id="hsroom"></div><div class="hs-side" id="hsside"><canvas id="hsmm"></canvas><div id="hsmon"></div></div><button class="btn" id="hsctr" onclick="hsCenter()">📍 回到陈歌</button><div class="hs-hint" id="hshint"></div><div class="hs-tick" id="hstick"></div>'
    + '<div class="hs-bot">' + (chase ? '<button class="btn" onclick="hsHideNear()">躲进最近的柜子</button>' : '<div class="hs-devs" id="hsdevs"></div>' + '<button class="btn" id="hslure" onclick="hsLure()">👂 引</button>' + (tapeReady() ? '<button class="btn" id="hstape" onclick="hsTape()">📼</button>' : '') + '<button class="btn pri big" id="hsgo" onclick="hsAct()">吓！</button>') + '</div>';
  const mm = $('#hsmm'); if (mm) { mm.onpointerdown = ev => { ev.stopPropagation(); const r = mm.getBoundingClientRect(); hGo(H, (ev.clientX - r.left) / r.width * H.M.w, (ev.clientY - r.top) / r.height * H.M.h); sfx('tap'); }; }
  hsHudTick(H, true); hsSize(); }
function hsHudTick(H, force) { H.hudT = (H.hudT || 0) - H.dt; if (H.hudT > 0 && !force) return; H.hudT = .12; const B = H.B, h = H.hero;
  const room = hmRoomAt(H.M, h.x, h.y); const rm = $('#hsroom'); if (rm) rm.textContent = (room ? room.n : '') + (h.hidden ? ' · 躲着' : '');
  const mp = $('#hsmp'); if (mp) mp.textContent = '精神 ' + Math.max(0, Math.round(C.mp));
  const tk = $('#hstick'); if (tk) { const l = H.log[H.log.length - 1]; tk.textContent = l && H.t - l.t < 6 ? l.s : ''; tk.className = 'hs-tick ' + (l ? l.cls : ''); }
  if (H.mode === 'chase') { const o = $('#hsobj'); if (o) o.textContent = H.item && !H.item.got ? '找到：' + H.item.n : H.o.wait ? '撑住 ' + Math.max(0, Math.ceil(H.o.wait - H.t)) + ' 秒' : '跑'; }
  else { const a = $('#hsatm'), at = $('#hsatt'); if (a) { a.style.width = Math.max(0, B.hero.hp / B.hero.mhp * 100) + '%'; at.textContent = '氛围 ' + Math.max(0, Math.round(B.hero.hp)) + '/' + B.hero.mhp; }
    const k = $('#hsk'); if (k) k.textContent = '吓退 ' + H.vis.filter(v => v.u.hp <= 0).length + '/' + H.vis.length + (H.tagGot != null ? ' · 校牌 ' + H.tagGot + '/8' : '');
    const au = $('#hsauto'); if (au) au.classList.toggle('on', H.auto);
    const dv = $('#hsdevs'); if (dv) { dv.innerHTML = H.M.slots.filter(s => s.k).map(s => { const S = hDev(s.k), inr = hDevInRange(H, s), rdy = hDevReady(H, s), arm = rdy && inr && hDevTargets(H, s).length; const p = s.cd > 0 ? Math.round((1 - s.cd / HB.devCd) * 100) : 100;
      return '<button class="hd' + (arm ? ' arm' : inr && rdy ? ' rdy' : '') + (s.ping && H.t - s.ping < .5 ? ' ping' : '') + '" style="--p:' + p + '%" onclick="hsDev(' + s.i + ')"><b>' + S.ic + '</b><small>' + (S.remote ? '📡' : '') + s.n + '</small></button>'; }).join(''); }
    const lu = $('#hslure'); if (lu) { const cd = Math.max(0, Math.ceil((h.lureCd || 0) - H.t)); lu.textContent = cd ? '引 ' + cd : '👂 引'; lu.disabled = !!cd; }
    const go = $('#hsgo'); if (go) { const a = hsActPlan(H); go.textContent = a ? a.lab : '吓！'; go.disabled = !a; go.classList.toggle('arm', !!a); } }
  const ct = $('#hsctr'); if (ct) ct.style.display = H.focus || H.focusPt ? '' : 'none';
  const hn = $('#hshint'); if (hn) { const on = H.hint && H.hint.until > H.t; hn.textContent = on ? '💡 ' + H.hint.s : ''; hn.classList.toggle('on', !!on); }
  hsMini(H); hsMonitors(H); }
/* 监控小窗：每批游客那边的画面（点一下镜头切过去） */
function hsMonitors(H) { const el = $('#hsmon'); if (!el || !H.world) return; const wr = $('#hsw'), side = $('#hsside'), room = (wr.clientHeight || 400) - (parseInt($('#hcv').style.top) || 0) - (($('#hshud .hs-bot') || {}).offsetHeight || 0) - 110;
  const max = Math.max(0, Math.min(3, Math.floor(room / 92))), list = (H.mode === 'house' ? hActive(H).sort((a, b) => b.wi - a.wi) : (H.boss ? [H.boss] : [])).slice(0, max);
  while (el.children.length > list.length) el.lastChild.remove(); while (el.children.length < list.length) { const c = document.createElement('canvas'); c.width = 96; c.height = 72; c.className = 'hmon'; el.appendChild(c); }
  list.forEach((v, i) => { const c = el.children[i], g = c.getContext('2d'); g.imageSmoothingEnabled = false; const sx = clamp(Math.round(v.x * 16 + 8 - 48), 0, H.world.width - 96), sy = clamp(Math.round(v.y * 16 - 32), 0, H.world.height - 72);
    g.drawImage(H.world, sx, sy, 96, 72, 0, 0, 96, 72); g.fillStyle = 'rgba(30,60,40,.22)'; g.fillRect(0, 0, 96, 72); g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = (H.t * 20 | 0) % 3; y < 72; y += 3) g.fillRect(0, y, 96, 1);
    const armed = H.mode === 'house' && H.M.slots.some(s => s.armed && hDevTargets(H, s).includes(v)); c.classList.toggle('arm', armed); c.classList.toggle('on', H.focus === v);
    const rm = hmRoomAt(H.M, v.x, v.y); g.fillStyle = '#000a'; g.fillRect(0, 62, 96, 10); g.fillStyle = armed ? '#ff8a6a' : '#cfe8d0'; g.font = '8px sans-serif'; g.fillText('CAM' + (i + 1) + ' ' + (rm ? rm.n : '') + (armed ? ' ⚠' : ''), 2, 70);
    if (H.t % 1 < .6) { g.fillStyle = '#e02020'; g.fillRect(89, 3, 4, 4); } c.onpointerdown = ev => { ev.stopPropagation(); H.focus = v; H.focusPt = null; sfx('tap'); }; }); }
function hsCenter() { const H = HS; if (!H) return; H.focus = null; H.focusPt = null; sfx('tap'); hsHudTick(H, true); }
function hsZoom() { const H = HS; if (!H) return; H.zoomOut = !H.zoomOut; sfx('tap'); hsSize(); const b = $('#hszoom'); if (b) b.classList.toggle('on', H.zoomOut); }
function hsLure() { const H = HS; if (!H || H.phase !== 'live' || H.done || H.paused) return; hLure(H); hsHudTick(H, true); }
function hsMini(H) { const mm = $('#hsmm'); if (!mm || !H.minimap) return; const M = H.M, s = 3; if (mm.width !== M.w * s) { mm.width = M.w * s; mm.height = M.h * s; } const g = mm.getContext('2d'); g.clearRect(0, 0, mm.width, mm.height);
  g.fillStyle = 'rgba(10,10,14,.8)'; g.fillRect(0, 0, mm.width, mm.height); g.fillStyle = 'rgba(120,120,130,.45)'; for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) if (!M.hs[y * M.w + x] || M.hides.some(e => e.x === x && e.y === y)) g.fillRect(x * s, y * s, s, s);
  for (const sl of M.slots) if (sl.k) { g.fillStyle = sl.cd > 0 ? '#665' : '#e8b04a'; g.fillRect(sl.x * s, sl.y * s, s, s); }
  if (H.item && !H.item.got) { g.fillStyle = '#f0e090'; g.fillRect(H.item.x * s - 1, H.item.y * s - 1, s + 2, s + 2); }
  for (const v of H.vis) if (v.st !== 'wait' && v.st !== 'gone') { g.fillStyle = v.st === 'flee' ? '#888' : '#ff5a3a'; g.fillRect(Math.round(v.x * s), Math.round(v.y * s), s, s); }
  if (H.boss && (H.boss.hunt || hDist(H.boss, H.hero) < 6)) { g.fillStyle = '#ff2020'; g.fillRect(Math.round(H.boss.x * s) - 1, Math.round(H.boss.y * s) - 1, s + 2, s + 2); }
  g.fillStyle = '#fff'; g.fillRect(Math.round(H.hero.x * s), Math.round(H.hero.y * s), s, s); }
/* 「吓！」按钮现在会做什么 */
function hsActPlan(H) { const h = H.hero, ac = hActive(H); const near = ac.filter(v => hDist(v, h) <= 1.6).sort((a, b) => hDist(a, h) - hDist(b, h))[0];
  if (near && h.hidden && h.pcd <= 0) return { lab: '扑出去！', f: () => hPounce(H, near) };
  let best = null, bd = 9; for (const s of H.M.slots) { if (!hDevReady(H, s) || !hDevInRange(H, s)) continue; const tg = hDevTargets(H, s); if (!tg.length) continue; const d = Math.min(...tg.map(v => hDist(v, s))); if (d < bd) { bd = d; best = s; } }
  if (best) return { lab: hDev(best.k).ic + ' ' + best.n + (best.sp ? '' : ' 号') + (bd <= hPerf(best) ? ' ⭕' : ''), f: () => hTrigger(H, best) };
  if (near && h.pcd <= 0) return { lab: '扑！', f: () => hPounce(H, near) };
  const fv = H.vis.filter(v => (v.st === 'flee' && !v.caught || v.st === 'run') && hDist(v, h) <= 4).sort((a, b) => hDist(a, h) - hDist(b, h))[0]; if (fv && h.chase !== fv) return { lab: '追上去！', f: () => { h.chase = fv; h.path = null; } }; return null; }
function hsAct() { const H = HS; if (!H || H.phase !== 'live' || H.done) return; const a = hsActPlan(H); if (a) { a.f(); hsHudTick(H, true); } else toast('附近没有能吓的游客'); }
function hsDev(i) { const H = HS; if (!H || H.phase !== 'live') return; const s = H.M.slots[i]; if (!s) return; if (hDevInRange(H, s) && hDevReady(H, s) && hDevTargets(H, s).length) { hTrigger(H, s); hsHudTick(H, true); return; } if (!hDevInRange(H, s)) { hsGoNear(H, s); toast('走到 ' + s.n + ' 号机关旁边'); } else hTrigger(H, s); }
function hsGoNear(H, s) { const l = hLurk(H, s); if (l) hGo(H, l[0], l[1]); else hGo(H, s.x, s.y); }
/* 磁带：一天一次，里面所有游客恐惧 + 破绽 */
function hsTape() { const H = HS; if (!H || H.phase !== 'live' || !tapeReady()) return; const ac = hActive(H); if (!ac.length) { toast('里面还没有游客'); return; } C.tapeDay = C.day; for (const v of ac) { addSt(H.B, v.u, 'fear', 3); addSt(H.B, v.u, 'vuln', 2); hBub(H, v, '……谁在哭？', 1.8); } hLog(H, '陈歌按下了播放键。整座鬼屋都是哭声。', 'epic'); sfx('static'); H.black = .4; const b = $('#hstape'); if (b) b.remove(); }
function hsAuto() { const H = HS; if (!H) return; H.auto = !H.auto; sfx('tap'); hsHudTick(H, true); }
function hsHideNear() { const H = HS; if (!H) return; const h = H.hero; let best = null, bd = 1e9; for (const e of H.M.hides) { const f = hmField(H.M, e.x, e.y, 'h')[h.ty * H.M.w + h.tx]; if (f >= 0 && f < bd) { bd = f; best = e; } } if (best) hGo(H, best.x, best.y); }
/* 点地图 */
function hsTap(ev) { const H = HS; if (!H) return; const [x, y] = hsPt(H, ev);
  if (H.phase === 'setup') { const s = H.M.slots.find(q => Math.hypot(q.x - x, q.y - y) < .8); if (s) return hsPickSlot(H, s, 0); const st = H.M.staff.find(q => Math.abs(q.x - x) < .7 && y > q.y - 1.5 && y < q.y + .7); if (st) return hsPickSlot(H, st, 1); hsPickClose(); return; }
  if (H.phase !== 'live' || H.done || H.paused) return; H.auto = false; const h = H.hero;
  if (H.mode === 'house') { const v = hActive(H).concat(H.vis.filter(q => q.st === 'flee' && !q.caught)).filter(q => Math.hypot(q.x - x, q.y - .5 - y) < 1).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; if (v) { h.chase = v; h.path = null; sfx('tap'); if (v.st === 'flee') { hFloat(H, h.x, h.y - 1.6, '追！', 'txt'); if (hDist(v, h) <= 1.3) hCatch(H, v); } else if (hDist(v, h) <= 1.5 && h.pcd <= 0) hPounce(H, v); return; }
    const s = H.M.slots.find(q => q.k && Math.hypot(q.x - x, q.y - y) < .75); if (s) return hsDev(s.i);
    const st = H.staff.find(q => Math.abs(q.x - x) < .7 && y > q.y - 1.5 && y < q.y + .7); if (st) { if (hStaffGo(H, st)) { sfx('tap'); hFloat(H, st.x, st.y - 1.6, PETS[st.k].n + '：去了！', 'staff'); } return; } }
  hGo(H, x, y); sfx('tap'); }
/* 拖动地图看别处（不动陈歌）；轻点才算走路/出手 */
let HPAN = null;
function hsDown(ev) { const H = HS; if (!H) return; if (H.phase !== 'live' || H.done || H.paused) return hsTap(ev); HPAN = { x: ev.clientX, y: ev.clientY, cx: H.cam.x, cy: H.cam.y, moved: false, id: ev.pointerId }; try { ev.target.setPointerCapture(ev.pointerId); } catch (e) {} }
function hsMove(ev) { const H = HS; if (!H || !HPAN || ev.pointerId !== HPAN.id) return; const dx = ev.clientX - HPAN.x, dy = ev.clientY - HPAN.y; if (!HPAN.moved && Math.hypot(dx, dy) < 9) return; HPAN.moved = true; const cv = $('#hcv'), r = cv.getBoundingClientRect(), s = r.width / cv.width;
  const cx = HPAN.cx - dx / s + cv.width / 2, cy = HPAN.cy - dy / s + cv.height / 2; H.focus = null; H.focusPt = [(cx - 8) / 16, (cy - 4) / 16]; }
function hsUp(ev) { const p = HPAN; HPAN = null; if (!p || ev.pointerId !== p.id) return; if (!p.moved) hsTap(ev); else hsHudTick(HS, true); }
function hsKey(e) { const H = HS; if (!H || H.phase !== 'live' || H.done) return false; if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { hsPause(); return true; } if (H.paused) return false; const k = e.key, d = { ArrowDown: 0, s: 0, ArrowLeft: 1, a: 1, ArrowRight: 2, d: 2, ArrowUp: 3, w: 3 }[k];
  if (d != null) { const h = H.hero; hGo(H, h.tx + HD[d][0], h.ty + HD[d][1]); return true; } if (k === ' ' || k === 'Enter') { if (H.mode === 'house') hsAct(); else hsHideNear(); return true; } return false; }

/* ---------- 主循环 ---------- */
function hsFrame(now) { const H = HS; if (!H || STATE.house !== H) return; const dt = Math.min(.05, (now - (H.last || now)) / 1000); H.last = now; H.dt = dt;
  if (H.phase === 'live' && !H.done && !H.paused && !UI.modal && !document.hidden) { const sp = (H.auto ? 1.5 : 1) * (H.slow > 0 ? .35 : 1); if (H.slow > 0) H.slow -= dt; if (H.red > 0) H.red -= dt * 1.5; hStep(H, dt * sp); if (H.shake > 0) H.shake -= dt; if (H.black > 0) H.black -= dt; hsCam(H); hsHudTick(H); }
  if (H.done && H.phase === 'live' && !H.fin) { H.fin = 1; hsDraw(H); hsTextLayer(H); hsFinish(H); return; }
  hsDraw(H); hsTextLayer(H); H.raf = requestAnimationFrame(hsFrame); }
function hsEndPanel(H) { const B = H.B, rw = H.rw, s = H.stats, el = $('#hsset'), k = H.scared, n = H.vis.length; $('#hshud').innerHTML = ''; $('#hsfx').innerHTML = ''; const pz = $('#hspause'); if (pz) pz.remove();
  el.innerHTML = '<div class="hs-end"><div class="c1">' + (H.res === 'win' ? '游客尖叫着跑了出去' : (H.lost || '“一点都不吓人。”')) + '</div><div class="hs-grid"><span>吓退</span><b>' + k + '/' + n + '</b><span>完美时机</span><b>' + s.perfect + '</b><span>扑人</span><b>' + s.pounce + '</b><span>被看见</span><b>' + s.exposed + '</b>' + (s.house ? '<span>全场尖叫</span><b>×' + s.house + '</b>' : '') + (s.chain ? '<span>连环尖叫</span><b>×' + s.chain + '</b>' : '') + (s.caught ? '<span>追到门口</span><b>' + s.caught + ' 人</b>' : '') + '</div>' + (H.grade ? '<div class="hs-grade g' + H.grade + '">' + H.grade + '<small>' + ({ S: '全吓跑、没被看见、两次以上完美：尖叫 +30%，门票 +100', A: '全吓跑：尖叫 +15%，门票 +30', B: '吓跑了一半以上', C: '下次换个布置试试' })[H.grade] + '</small></div>' : '') + (H.best ? '<div class="mini">最狠的一下：' + esc(H.best.txt) + ' -' + H.best.v + '</div>' : '')
    + (rw ? '<div class="hs-rw">' + (rw.money ? '门票 +' + rw.money + ' 元　' : '') + (rw.screams ? '尖叫 +' + rw.screams + '　' : '') + '经验 +' + rw.exp + (rw.picky ? '<br>挑剔的游客被吓哭了！' : '') + '</div>' : '') + '<button class="btn pri big" onclick="hsClose()">收工</button></div>';
  if (H.auto && C.auto) setTimeout(() => { if (HS === H) hsClose(); }, 900); }
window.addEventListener('resize', () => { if (HS && STATE.house) hsSize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && HS && STATE.house && HS.phase === 'live' && !HS.done) hsPause(true); });
